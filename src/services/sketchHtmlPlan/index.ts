import path from 'path'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import {
  normalize,
  openSketchHtmlFile,
  type HtmlArtboard,
  type SketchImage
} from '@/utils/zip'
import { processImage } from '@/utils/saveFile'
import { filterArtboards } from '../sketchHtmlAnalyze/filterArtboards'

export const sketchPlanInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)'),
  page_name: z.string().describe('page name (optional)').optional(),
  artboard_name: z.string().describe('artboard name (optional)').optional()
})

export type SketchPlanInputSchema = SchemaOutput<typeof sketchPlanInputSchema>

export async function previewImage(
  filePath: string,
  artboard: HtmlArtboard,
  images: SketchImage[]
) {
  let previewPath = ''

  if (artboard.imagePath) {
    const parsed = path.parse(filePath)
    const imgPath = normalize(artboard.imagePath)
    const imageData = images?.find(item => item.path.endsWith(imgPath))?.data
    if (imageData) {
      const extname = path.extname(imgPath)
      const fileName = path.basename(imgPath, extname)
      const dest = path.join(
        parsed.dir,
        `${parsed.name}.cache`,
        `${fileName}${extname}`
      )
      previewPath = await processImage(imageData, dest, artboard.width)
    }
  }

  return previewPath
}

/**
 * 获取sketch html文件中的指定artboard的基本信息
 * @param args 输入参数
 * @param args.file_path sketch html文件路径
 * @param args.page_name 指定页面名称(可选)
 * @param args.artboard_name 指定画板名称(可选)
 * @returns 输出参数，包含预览图片路径、宽度、高度等信息
 */
export async function handleSketchHtmlPlan(args: SketchPlanInputSchema) {
  let response = 'Sketch Exception'

  try {
    const sketchHtmlData = await openSketchHtmlFile(args.file_path)
    const targetArtboard = filterArtboards(args, sketchHtmlData.data.artboards)
    const previewPath = await previewImage(
      args.file_path,
      targetArtboard,
      sketchHtmlData.images
    )

    response = JSON.stringify({
      filePath: args.file_path,
      pageName: targetArtboard.pageName,
      artboardName: targetArtboard.name,
      previewPath,
      width: targetArtboard.width,
      height: targetArtboard.height
    })
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
