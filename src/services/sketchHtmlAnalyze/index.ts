import path from 'path'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { openSketchHtmlFile } from '@/utils/zip'
import { processImage, writeJsonFile } from '@/utils/saveFile'
import { getRect } from '@/utils/util'
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
  save_result: z
    .boolean()
    .describe('save analysis result (optional), default false')
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
 * @property {boolean} save_result - 是否保存分析结果JSON文件(可选)，默认false
 */
export type SketchAnalyzeInputSchema = SchemaOutput<
  typeof sketchAnalyzeInputSchema
>

/**
 * 分析sketch html文件(zip或目录)，提取指定节点数据，存储到指定位置json文件中，返回json文件位置
 * json位置拼接规则：{args.file_path所在文件夹}/{args.file_name无后缀}.cache/{pageName}_{artboardName}[_rect].json
 * @param args 分析参数
 * @returns json文件位置
 */
export async function handleSketchHtmlAnalyze(args: SketchAnalyzeInputSchema) {
  let response = 'Sketch Exception'

  try {
    const sketchHtmlData = await openSketchHtmlFile(args.file_path)
    const targetArtboard = filterArtboards(args, sketchHtmlData.data.artboards)
    const assembledArtboard = assembleArtboard(
      targetArtboard,
      args.assets_path,
      args.rect,
      args.exclude_rects,
      sketchHtmlData.images
    )

    const newRect = getRect(args.rect)
    const newExcludeRects = args.exclude_rects?.reduce<
      [number, number, number, number][]
    >((acc, r) => {
      const rect = getRect(r)
      if (rect) acc.push(rect)
      return acc
    }, [])

    const parsed = path.parse(args.file_path)
    if (args.save_result) {
      const targetPath = `${parsed.dir}/${parsed.name}.cache/${assembledArtboard.artboard.pageName ?? assembledArtboard.artboard.pageObjectID}_${assembledArtboard.artboard.name ?? assembledArtboard.artboard.objectID}${newRect ? `_${newRect.join('_')}` : ''}.json`
      await writeJsonFile(targetPath, assembledArtboard.artboard)
    }

    if (assembledArtboard.previewPath) {
      const imageData = sketchHtmlData.images?.find(item =>
        item.path.endsWith(assembledArtboard.previewPath)
      )?.data
      if (imageData) {
        const extname = path.extname(assembledArtboard.previewPath)
        const fileName = path.basename(assembledArtboard.previewPath, extname)
        const dest = path.join(
          parsed.dir,
          `${parsed.name}.cache`,
          `${fileName}${newRect ? `_${newRect.join('_')}` : ''}${newExcludeRects?.length ? `_exclude_${newExcludeRects.map(r => r.join('_')).join('-')}` : ''}${extname}`
        )
        assembledArtboard.previewPath = await processImage(
          imageData,
          dest,
          assembledArtboard.artboard.width,
          newRect
        )
      }
    }

    response = JSON.stringify(assembledArtboard)
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
