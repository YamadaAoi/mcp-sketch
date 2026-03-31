import path from 'path'
import { openSketchHtmlFile } from '@/utils/zip'
import { saveImage, writeJsonFile } from '@/utils/saveFile'
import { logger } from '@/utils/logger'
import type { SketchHtmlInputSchema } from '@/types'
import { filterArtboards } from './filterArtboards'
import { assembleArtboard } from './assembleArtboard'

/**
 * 分析sketch html zip文件，提取指定节点数据，存储到指定位置json文件中，返回json文件位置
 * json位置拼接规则：{args.file_path所在文件夹}/{args.file_name无后缀}/{nodeInfo.pageId}_{nodeInfo.artboardId}}.json
 * @param args 分析参数
 * @returns json文件位置
 */
export async function handleSketchHtmlAnalyze(args: SketchHtmlInputSchema) {
  let response = ''

  try {
    const sketchHtmlData = await openSketchHtmlFile(args.file_path)
    const targetArtboard = filterArtboards(args, sketchHtmlData.data.artboards)
    const assembledArtboard = assembleArtboard(
      targetArtboard,
      args.assets_path,
      args.rect,
      sketchHtmlData.images
    )

    const prompt = {
      meta: {
        description:
          'Design data extracted from Sketch exported HTML. All coordinates are relative to the artboard. Layers are flattened. Refer to the preview image to verify and refine the design structure.'
      },
      artboard: assembledArtboard.artboard
    }

    const parsed = path.parse(args.file_path)
    if (args.save_result ?? true) {
      const targetPath = `${parsed.dir}/${parsed.name}/${assembledArtboard.artboard.pageName ?? assembledArtboard.artboard.pageObjectID}_${assembledArtboard.artboard.name ?? assembledArtboard.artboard.objectID}${args.rect?.length === 4 ? `[${args.rect.join(',')}]` : ''}.json`
      await writeJsonFile(targetPath, prompt)
    }

    response = `Sketch Structure JSON: ${JSON.stringify(prompt)}.`

    let previewPath = ''

    if (assembledArtboard.previewPath) {
      const imageData = sketchHtmlData.images?.find(item =>
        item.path.endsWith(assembledArtboard.previewPath)
      )?.data
      if (imageData) {
        const fileName = path.basename(assembledArtboard.previewPath)
        previewPath = `${parsed.dir}/${parsed.name}/${fileName}`
        response = `${response}\nSketch Preview Image: ${previewPath}`
        saveImage(imageData, `${parsed.dir}/${parsed.name}`, fileName).catch(
          error => {
            logger.error(`Failed to save image ${previewPath}: ${error}`)
          }
        )
      }
    }
  } catch (error) {
    response = `Sketch analyze error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
