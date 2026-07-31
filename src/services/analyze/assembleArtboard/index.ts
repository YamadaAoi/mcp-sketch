import path from 'path'
import { createHash } from 'node:crypto'
import { readFile } from 'fs/promises'
import { pinyin } from 'pinyin-pro'
import {
  normalize,
  type HtmlArtboard,
  type HtmlLayer,
  type HtmlSketchArtboard,
  type HtmlSketchLayer
} from '@/utils/zip'
import { fileExists, processImage } from '@/utils/saveFile'
import { getEnv } from '@/utils/env'
import { roundIfExceeds } from '@/utils/util'
import type { SketchAnalyzeInputSchema } from '..'

function toPinyin(str: string): string {
  const cleaned = str.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, ' ').trim()
  const result = cleaned.replace(
    /[\u4e00-\u9fa5]+/g,
    m => ` ${pinyin(m, { toneType: 'none' })} `
  )
  return result.replace(/ +/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

function filterSketchLayer(lyr: HtmlSketchLayer) {
  return (
    (lyr.type === 'slice' && !!lyr.assets?.length) ||
    lyr.type === 'text' ||
    (lyr.type === 'shape' &&
      lyr.css?.some(
        s =>
          s.includes('background') ||
          s.includes('border') ||
          s.includes('shadow')
      ))
  )
}

function filterSketchLayerByRect(
  lyr: HtmlSketchLayer,
  rect?: [number, number, number, number],
  excludeRects?: [number, number, number, number][]
) {
  const r = lyr.rect
  if (r?.length !== 4) return false
  const [x, y, w, h] = r.map(Number)

  if (rect) {
    const isInRect =
      x >= rect[0] &&
      x < rect[0] + rect[2] &&
      y >= rect[1] &&
      y < rect[1] + rect[3] &&
      x + w > rect[0] &&
      x + w <= rect[0] + rect[2] &&
      y + h > rect[1] &&
      y + h <= rect[1] + rect[3]
    if (!isInRect) return false
  }

  if (excludeRects?.length) {
    const rRight = x + w
    const rBottom = y + h
    for (const e of excludeRects) {
      const eRight = e[0] + e[2]
      const eBottom = e[1] + e[3]
      if (x >= e[0] && y >= e[1] && rRight <= eRight && rBottom <= eBottom) {
        return false
      }
    }
  }

  return filterSketchLayer(lyr)
}

function calculateLayoutScore(rect: {
  x?: number
  y?: number
  width?: number
  height?: number
}) {
  const width = rect.width ?? 0
  const height = rect.height ?? 0
  const area = width * height
  const longestSide = Math.max(width, height)
  const minSide = Math.min(width, height)
  const aspectRatio = minSide > 0 ? longestSide / minSide : 0

  let score = area
  if (aspectRatio >= 30) {
    score += longestSide * 14
  }
  return score
}

function rankLayers(layers: HtmlLayer[]) {
  return [...layers].sort((a, b) => {
    const scoreA = calculateLayoutScore(a.rect ?? {})
    const scoreB = calculateLayoutScore(b.rect ?? {})
    return scoreB - scoreA
  })
}

function toSketchLayer(lyr: HtmlLayer): HtmlSketchLayer {
  const layer: HtmlSketchLayer = {
    type: lyr.type,
    name: lyr.name,
    rect: [
      roundIfExceeds(lyr.rect?.x)!,
      roundIfExceeds(lyr.rect?.y)!,
      roundIfExceeds(lyr.rect?.width)!,
      roundIfExceeds(lyr.rect?.height)!
    ]
  }
  if (lyr.styleName) {
    layer.styleName = lyr.styleName
  }
  if (lyr.css?.length) {
    layer.css = lyr.css
  }
  return layer
}

/**
 * 对已解析的图层（HtmlSketchLayer）做类型过滤 + 区域过滤 + 分页。
 * 用于缓存命中时复用 layer.json 中的数据，不重新解析设计稿。
 */
export function filterCachedLayers(
  layers: HtmlSketchLayer[],
  rect?: [number, number, number, number],
  excludeRects?: [number, number, number, number][],
  limit?: number,
  offset?: number
) {
  let filtered = layers.filter(l =>
    filterSketchLayerByRect(l, rect, excludeRects)
  )

  if (limit !== undefined) {
    const start = offset ?? 0
    filtered = filtered.slice(start, start + limit)
  }

  return filtered
}

async function compressAssets(
  layers: HtmlLayer[],
  sketchLayers: HtmlSketchLayer[],
  dest: string,
  images?: Array<{ path: string; data: Buffer }>,
  pageName?: string,
  artboardName?: string
) {
  const pageDir = pageName ? toPinyin(pageName) : ''
  const artboardDir = artboardName ? toPinyin(artboardName) : ''

  for (let i = 0; i < layers.length; i++) {
    const l = layers[i]
    if (!l.exportable?.length) continue
    sketchLayers[i].assets = await Promise.all(
      l.exportable.map(async e => {
        const normalizedPath = normalize(e.path)
        const imageData = images?.find(item =>
          item.path.endsWith(normalizedPath)
        )?.data
        let imagePath = ''
        if (imageData) {
          const parsed = path.parse(normalizedPath)
          const pinyinName = toPinyin(parsed.name)
          const destPath = path.join(
            dest,
            pageDir,
            artboardDir,
            `${pinyinName}${parsed.ext}`
          )
          imagePath = await processImage(imageData, destPath)
        }
        return {
          ...e,
          path: imagePath
        }
      })
    )
  }
}

export async function processPreview(
  artboard: HtmlSketchArtboard,
  filePath: string,
  rect?: [number, number, number, number],
  excludeRects?: [number, number, number, number][],
  images?: Array<{ path: string; data: Buffer }>
) {
  if (!artboard.previewPath) return

  const imageData = images?.find(item =>
    item.path.endsWith(artboard.previewPath!)
  )?.data

  // 缓存命中时没有 zip 图片缓冲，回退读取已落盘的全量预览文件
  let sourceBuffer = imageData
  if (!sourceBuffer && !images && (await fileExists(artboard.previewPath))) {
    sourceBuffer = await readFile(artboard.previewPath)
  }
  if (!sourceBuffer) return

  const extname = path.extname(artboard.previewPath)
  const fileName = path.basename(artboard.previewPath, extname)
  const cwd = getEnv('CWD')
  const designFileName = path.basename(filePath, '.zip')
  const dest = path.resolve(
    cwd,
    `.sketch-cache/artboards/${designFileName}/${artboard.pageName}/${artboard.name}`,
    `${fileName}${rect ? `_${rect.join('_')}` : ''}${excludeRects?.length ? `_exclude_${createHash('md5').update(JSON.stringify(excludeRects)).digest('hex').slice(0, 8)}` : ''}${extname}`
  )
  artboard.previewPath = await processImage(
    sourceBuffer,
    dest,
    artboard.width,
    rect
  )
}

export async function assembleArtboard(
  artboard: HtmlArtboard,
  args: SketchAnalyzeInputSchema,
  images?: Array<{
    path: string
    data: Buffer
  }>
) {
  const dest = args.assets_path ?? getEnv('ASSETS_PATH')

  const ranked = rankLayers(artboard.layers)

  const newArtboard: HtmlSketchArtboard = {
    previewPath: artboard.imagePath ? normalize(artboard.imagePath) : undefined,
    pageName: artboard.pageName,
    pageObjectID: artboard.pageObjectID,
    name: artboard.name,
    objectID: artboard.objectID,
    width: artboard.width,
    height: artboard.height,
    layers: ranked.map(toSketchLayer)
  }

  await compressAssets(
    ranked,
    newArtboard.layers,
    dest,
    images,
    artboard.pageName,
    artboard.name
  )

  return newArtboard
}
