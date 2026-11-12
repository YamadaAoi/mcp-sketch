import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { openSketchHtmlFile, type HtmlSketchLayer } from '@/utils/zip'
import { getRect } from '@/utils/util'
import { filterArtboards } from './filterArtboards'
import {
  assembleArtboard,
  filterLayers,
  processPreview
} from './assembleArtboard'

/**
 * 定位数组格式的列声明，行内值严格按此顺序排列
 * 行内槽位固定：空值按列类型取（content 为 ""，css/assets 为 []）
 */
const LAYER_COLUMNS = [
  'index',
  'name',
  'type',
  'x',
  'y',
  'w',
  'h',
  'content',
  'css',
  'assets'
] as const

/**
 * 图层数据转定位数组：列名声明一次，行内按序取值，省去逐层重复的 key
 * 低频可选字段（opacity/rotation）不占列，收入按 index 索引的 extras，避免行宽膨胀；
 * styleName 不输出（css 已承载样式值，设计系统级样式名聚合见 list 的 tokens.styleNames）
 * 行宽固定为 LAYER_COLUMNS.length
 */
function toPositionalLayers(layers: HtmlSketchLayer[]) {
  const extras: Record<string, Record<string, number>> = {}
  const rows = layers.map((l, i) => {
    const [x = '', y = '', w = '', h = ''] = l.rect ?? []
    const extra: Record<string, number> = {}
    if (l.opacity !== undefined) extra.opacity = l.opacity
    if (l.rotation !== undefined) extra.rotation = l.rotation
    const index = l.index ?? i
    if (Object.keys(extra).length) extras[index] = extra
    return [
      index,
      l.name,
      l.type,
      x,
      y,
      w,
      h,
      l.content ?? '',
      l.css ?? [],
      l.assets ?? []
    ]
  })
  return { rows, extras }
}

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
 * 元数据为 key-value，图层数组为定位数组格式（columns 声明列序，行内按序取值）
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

  const { rows, extras } = toPositionalLayers(layers)

  return JSON.stringify({
    pageName: artboard.pageName,
    name: artboard.name,
    width: artboard.width,
    height: artboard.height,
    total,
    previewPath: artboard.previewPath,
    columns: LAYER_COLUMNS,
    layers: rows,
    ...(Object.keys(extras).length ? { extras } : {})
  })
}
