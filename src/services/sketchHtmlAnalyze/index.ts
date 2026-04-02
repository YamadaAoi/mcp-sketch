import path from 'path'
import { openSketchHtmlFile } from '@/utils/zip'
import { processImage, writeJsonFile } from '@/utils/saveFile'
import { getRect } from '@/utils/util'
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

    const newRect = getRect(args.rect)
    const parsed = path.parse(args.file_path)
    if (args.save_result ?? true) {
      const targetPath = `${parsed.dir}/${parsed.name}/${assembledArtboard.artboard.pageName ?? assembledArtboard.artboard.pageObjectID}_${assembledArtboard.artboard.name ?? assembledArtboard.artboard.objectID}${newRect ? `_${newRect.join('_')}` : ''}.json`
      await writeJsonFile(targetPath, prompt)
    }

    response = `Sketch Structure JSON: ${JSON.stringify(prompt)}.`

    if (assembledArtboard.previewPath) {
      const imageData = sketchHtmlData.images?.find(item =>
        item.path.endsWith(assembledArtboard.previewPath)
      )?.data
      if (imageData) {
        const extname = path.extname(assembledArtboard.previewPath)
        const fileName = path.basename(assembledArtboard.previewPath, extname)
        const dest = path.join(
          parsed.dir,
          parsed.name,
          `${fileName}${newRect ? `_${newRect.join('_')}` : ''}${extname}`
        )
        const imagePath = await processImage(
          imageData,
          dest,
          assembledArtboard.artboard.width,
          newRect
        )
        response = `${response}
        Sketch Preview Image: ${imagePath}`
      }
    }
  } catch (error) {
    response = `Sketch analyze error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
