import path from 'path'
import {
  openSketchHtmlFile,
  type HtmlArtboard,
  type HtmlSketchArtboard
} from '@/utils/zip'
import { saveImage, writeJsonFile } from '@/utils/saveFile'
import { logger } from '@/utils/logger'
import type { SketchHtmlInputSchema } from '@/types'

function filterArtboards(
  args: SketchHtmlInputSchema,
  artboards?: HtmlArtboard[]
) {
  if (!artboards?.length) {
    throw new Error(`Sketch Html Artboard format error`)
  }
  let filteredArtboards = [...artboards]
  if (args.page_id) {
    filteredArtboards = filteredArtboards.filter(
      item => item.pageObjectID === args.page_id
    )
  } else if (args.page_name) {
    filteredArtboards = filteredArtboards.filter(
      item => item.pageName === args.page_name
    )
  }
  if (args.artboard_id) {
    filteredArtboards = filteredArtboards.filter(
      item => item.objectID === args.artboard_id
    )
  } else if (args.artboard_name) {
    filteredArtboards = filteredArtboards.filter(
      item => item.name === args.artboard_name
    )
  }

  if (!filteredArtboards.length) {
    throw new Error(`Sketch Html Artboard ${args.artboard_id} not found`)
  }

  return filteredArtboards[0]
}

function normalize(p: string) {
  return decodeURIComponent(p).replace(/\\/g, '/').replace(/\/+/g, '/')
}

function assembleArtboard(
  artboard: HtmlArtboard,
  assetsPath?: string,
  images?: Array<{
    path: string
    data: Buffer
  }>
) {
  const dest = assetsPath ?? 'src/assets/sketch'
  const newArtboard: HtmlSketchArtboard = {
    pageName: artboard.pageName,
    pageObjectID: artboard.pageObjectID,
    name: artboard.name,
    objectID: artboard.objectID,
    width: artboard.width,
    height: artboard.height,
    imagePath: artboard.imagePath,
    layers: artboard.layers.map(l => {
      return {
        type: l.type,
        name: l.name,
        rect: {
          x: l.rect?.x,
          y: l.rect?.y,
          w: l.rect?.width,
          h: l.rect?.height
        },
        styleName: l.styleName,
        css: l.css,
        assets: l.exportable?.map(e => {
          let imagePath = ''
          const imageData = images?.find(item =>
            normalize(item.path).endsWith(normalize(e.path))
          )?.data
          if (imageData) {
            const fileName = path.basename(e.path)
            imagePath = path.join(dest, fileName)
            saveImage(imageData, dest, fileName).catch(error => {
              logger.error(`Failed to save image ${e.path}: ${error}`)
            })
          }
          return {
            ...e,
            path: imagePath
          }
        })
      }
    })
  }
  return newArtboard
}

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
    const artboard = filterArtboards(args, sketchHtmlData.data.artboards)
    const assembledArtboard = assembleArtboard(
      artboard,
      args.assets_path,
      sketchHtmlData.images
    )

    const prompt = {
      meta: {
        description: `This is sanitized structural data from a Sketch design file.
              All frame properties (x, y, w, h) are relative to the parent container.
              Extract the images used to the specified location, please infer the image location reasonably.`
      },
      artboard: assembledArtboard
    }

    const parsed = path.parse(args.file_path)
    const targetPath = `${parsed.dir}/${parsed.name}/${assembledArtboard.pageName ?? assembledArtboard.pageObjectID}_${assembledArtboard.name ?? assembledArtboard.objectID}.json`

    await writeJsonFile(targetPath, prompt, args.compress)

    response = `Please use appropriate shell commands to read the complete design structure JSON file: ${targetPath}.`

    let previewPath = ''

    if (assembledArtboard.imagePath) {
      const imageData = sketchHtmlData.images?.find(item =>
        normalize(item.path).endsWith(normalize(assembledArtboard.imagePath!))
      )?.data
      if (imageData) {
        const fileName = path.basename(normalize(assembledArtboard.imagePath))
        previewPath = `${parsed.dir}/${parsed.name}/${fileName}`
        response = `${response}preview image: ${previewPath}`
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
