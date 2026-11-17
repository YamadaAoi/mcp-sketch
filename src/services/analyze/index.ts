import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { getDesignStamp, openSketchHtmlFile } from '@/utils/zip'
import { getEnv } from '@/utils/env'
import { getRect } from '@/utils/util'
import { filterArtboards } from './filterArtboards'
import {
  getAnalyzeCachePath,
  readAnalyzeCache,
  writeAnalyzeCache,
  type AnalyzeCacheKey
} from './cache'
import {
  assembleArtboard,
  filterLayers,
  isLayerDedupEnabled,
  LAYER_COLUMNS,
  processPreview,
  toPositionalLayers
} from './assembleArtboard'

/**
 * 解析sketch html文件分析参数
 */
export const sketchAnalyzeInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)'),
  page_name: z.string().describe('page name (required)'),
  artboard_name: z.string().describe('artboard name (required)'),
  rect: z
    .array(z.number())
    .length(4)
    .describe(
      'rect [x, y, width, height] (optional); layers fully inside the region go to `layers`, slight straddles (inside the region expanded by 10px) come back separately in `adjacent`'
    )
    .optional(),
  exclude_rects: z
    .array(z.array(z.number()).length(4))
    .describe(
      'exclude rects [x, y, width, height] (optional); only layers fully inside these regions are excluded'
    )
    .optional(),
  name: z
    .string()
    .describe(
      'filter layers by name keyword, case-insensitive substring match (optional)'
    )
    .optional(),
  type: z
    .enum(['text', 'shape', 'slice'])
    .describe('filter layers by type (optional)')
    .optional(),
  assets_path: z
    .string()
    .describe(
      'assets path (optional), default ASSETS_PATH from .env.sketch or src/assets/sketch'
    )
    .optional(),
  limit: z
    .number()
    .describe('number of top-scored layers to return (optional)')
    .optional(),
  offset: z
    .number()
    .describe('starting index in sorted layers (optional, default 0)')
    .optional()
})

export type SketchAnalyzeInputSchema = SchemaOutput<
  typeof sketchAnalyzeInputSchema
>

function parseRects(
  rect?: number[],
  excludeRects?: number[][]
): {
  rect?: [number, number, number, number]
  excludeRects?: [number, number, number, number][]
} {
  return {
    rect: getRect(rect),
    excludeRects: excludeRects?.reduce<[number, number, number, number][]>(
      (acc, r) => {
        const parsed = getRect(r)
        if (parsed) acc.push(parsed)
        return acc
      },
      []
    )
  }
}

/**
 * 分析sketch html文件(zip或目录)，提取指定节点数据，返回JSON格式的artboard信息
 * 元数据为 key-value，图层数组为定位数组格式（columns 声明列序，行内按序取值）
 * 结果按参数组合落盘缓存于 .sketch-cache/{design}/analyze/（CLI/MCP 共用），设计稿版本戳失效；
 * 设计稿解析层另有进程内缓存（DESIGN_MEMO_MAX），供同会话不同参数组合共享一次解析
 * @param args 分析参数
 * @returns artboard JSON字符串
 */
export async function sketchAnalyze(args: SketchAnalyzeInputSchema) {
  const { file_path } = args
  const { rect, excludeRects } = parseRects(args.rect, args.exclude_rects)

  // 结果按参数组合落盘缓存：命中即免解析返回，CLI 与 MCP 共用
  const stamp = await getDesignStamp(file_path)
  const cacheKey: AnalyzeCacheKey = {
    page_name: args.page_name,
    artboard_name: args.artboard_name,
    rect,
    exclude_rects: excludeRects?.length ? excludeRects : undefined,
    name: args.name,
    type: args.type,
    limit: args.limit,
    offset: args.offset,
    assets_path: args.assets_path ?? getEnv('ASSETS_PATH'),
    layer_dedup: isLayerDedupEnabled()
  }
  const cachePath = getAnalyzeCachePath(file_path, cacheKey)
  const cached = await readAnalyzeCache(cachePath, stamp)
  if (cached) return JSON.stringify(cached)

  const sketchHtmlData = await openSketchHtmlFile(file_path)
  const targetArtboard = filterArtboards(args, sketchHtmlData.data.artboards)
  const artboard = await assembleArtboard(
    targetArtboard,
    args,
    sketchHtmlData.images
  )

  artboard.previewPath = await processPreview(
    artboard,
    file_path,
    rect,
    excludeRects,
    sketchHtmlData.images
  )

  const { layers, total, adjacent, clones } = filterLayers(artboard.layers, {
    rect,
    excludeRects,
    name: args.name,
    type: args.type,
    limit: args.limit,
    offset: args.offset
  })

  const { rows, extras } = toPositionalLayers(layers)

  // 压线图层同格式输出（列序复用 columns），opacity/rotation 并入同一张稀疏 extras 表
  let adjacentRows: typeof rows = []
  if (adjacent.length) {
    const adj = toPositionalLayers(adjacent)
    adjacentRows = adj.rows
    Object.assign(extras, adj.extras)
  }

  const response = {
    pageName: artboard.pageName,
    name: artboard.name,
    width: artboard.width,
    height: artboard.height,
    total,
    previewPath: artboard.previewPath,
    columns: LAYER_COLUMNS,
    layers: rows,
    ...(adjacentRows.length ? { adjacent: adjacentRows } : {}),
    ...(Object.keys(extras).length ? { extras } : {}),
    ...(Object.keys(clones).length ? { clones } : {})
  }

  await writeAnalyzeCache(cachePath, stamp, cacheKey, response)
  return JSON.stringify(response)
}
