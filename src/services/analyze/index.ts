import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { openSketchHtmlFile } from '@/utils/zip'
import { filterArtboards } from './filterArtboards'
import { assembleArtboard } from './assembleArtboard'

/**
 * 解析sketch html文件分析参数
 */
export const sketchAnalyzeInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)'),
  page_name: z.string().describe('page name (optional)').optional(),
  artboard_name: z.string().describe('artboard name (optional)').optional(),
  rect: z
    .array(z.number())
    .describe('rect [x, y, width, height] (optional)')
    .optional(),
  exclude_rects: z
    .array(z.array(z.number()))
    .describe('exclude rects [x, y, width, height] (optional)')
    .optional(),
  assets_path: z
    .string()
    .describe('assets path (optional), default src/assets/sketch')
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

/**
 * 解析sketch html文件分析参数类型
 * @property {string} file_path - sketch html文件路径(zip或目录,必填)
 * @property {string} page_name - 指定页面名称(可选)
 * @property {string} artboard_name - 指定画板名称(可选)
 * @property {number[]} rect - 指定解析矩形区域(可选)，格式为[x, y, width, height](x, y为左上角坐标， width, height为矩形宽度和高度)
 * @property {number[][]} exclude_rects - 指定排除解析矩形区域(可选)，格式为[x, y, width, height](x, y为左上角坐标， width, height为矩形宽度和高度)
 * @property {string} assets_path - 指定静态资源存放路径(可选)，默认src/assets/sketch
 */
export type SketchAnalyzeInputSchema = SchemaOutput<
  typeof sketchAnalyzeInputSchema
>

/**
 * 分析sketch html文件(zip或目录)，提取指定节点数据，返回JSON格式的artboard信息
 * @param args 分析参数
 * @returns artboard JSON字符串
 */
export async function sketchAnalyze(args: SketchAnalyzeInputSchema) {
  let response = 'Sketch Exception'

  try {
    const sketchHtmlData = await openSketchHtmlFile(args.file_path)
    const targetArtboard = filterArtboards(args, sketchHtmlData.data.artboards)
    const assembledArtboard = await assembleArtboard(
      targetArtboard,
      args,
      sketchHtmlData.images
    )
    response = JSON.stringify(assembledArtboard)
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
