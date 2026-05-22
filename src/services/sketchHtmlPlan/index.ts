import path from 'path'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { normalize, openSketchHtmlFile } from '@/utils/zip'
import { processImage } from '@/utils/saveFile'
import { filterArtboards } from '../sketchHtmlAnalyze/filterArtboards'

/**
 * 解析sketch html zip文件分析参数
 */
export const sketchPlanInputSchema = z.object({
  file_path: z.string().describe('sketch html zip file path(required)'),
  page_name: z.string().describe('page name (optional)').optional(),
  artboard_name: z.string().describe('artboard name (optional)').optional()
})

/**
 * 解析sketch html zip文件分析参数类型
 * @property {string} file_path - sketch html zip文件文件路径(必填)
 * @property {string} page_name - 指定页面名称(可选)
 * @property {string} artboard_name - 指定画板名称(可选)
 */
export type SketchPlanInputSchema = SchemaOutput<typeof sketchPlanInputSchema>

export async function handleSketchHtmlPlan(args: SketchPlanInputSchema) {
  let response = 'Sketch Exception'

  try {
    const parsed = path.parse(args.file_path)
    const sketchHtmlData = await openSketchHtmlFile(args.file_path)
    const targetArtboard = filterArtboards(args, sketchHtmlData.data.artboards)

    if (targetArtboard.imagePath) {
      const imagePath = normalize(targetArtboard.imagePath)
      const imageData = sketchHtmlData.images?.find(item =>
        item.path.endsWith(imagePath)
      )?.data
      if (imageData) {
        const extname = path.extname(imagePath)
        const fileName = path.basename(imagePath, extname)
        const dest = path.join(parsed.dir, parsed.name, `${fileName}${extname}`)
        const previewPath = await processImage(
          imageData,
          dest,
          targetArtboard.width
        )
        response = JSON.stringify({
          previewPath,
          filePath: args.file_path,
          page_name: targetArtboard.pageName,
          artboard_name: targetArtboard.name,
          width: targetArtboard.width,
          height: targetArtboard.height
        })
      }
    }
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
