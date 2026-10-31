import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { openSketchHtmlFile } from '@/utils/zip'
import { getRect } from '@/utils/util'
import { filterArtboards } from './filterArtboards'
import {
  assembleArtboard,
  filterLayers,
  processPreview
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
    .describe('rect [x, y, width, height] (optional)')
    .optional(),
  exclude_rects: z
    .array(z.array(z.number()).length(4))
    .describe('exclude rects [x, y, width, height] (optional)')
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
 * 解析结果按设计稿版本戳做进程内缓存，图片数据按需读取
 * @param args 分析参数
 * @returns artboard JSON字符串
 */
export async function sketchAnalyze(args: SketchAnalyzeInputSchema) {
  const { file_path } = args
  const { rect, excludeRects } = parseRects(args.rect, args.exclude_rects)

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

  const { layers, total } = filterLayers(artboard.layers, {
    rect,
    excludeRects,
    name: args.name,
    type: args.type,
    limit: args.limit,
    offset: args.offset
  })

  return JSON.stringify({ ...artboard, total, layers })
}
