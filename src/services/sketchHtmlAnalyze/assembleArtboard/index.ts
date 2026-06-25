import path from 'path'
import {
  normalize,
  type HtmlArtboard,
  type HtmlLayer,
  type HtmlSketchArtboard,
  type HtmlSketchLayer
} from '@/utils/zip'
import { processImage } from '@/utils/saveFile'
import { getRect, roundIfExceeds } from '@/utils/util'
import type { SketchAnalyzeInputSchema } from '..'

function filterLayers(lyr: HtmlLayer) {
  return (
    (lyr.type === 'slice' && !!lyr.exportable?.length) ||
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

function filterLayersByRect(
  lyr: HtmlLayer,
  rect?: [number, number, number, number],
  excludeRects?: [number, number, number, number][]
) {
  const r = lyr.rect
  if (r?.x == null || r?.y == null || r?.width == null || r?.height == null) {
    return false
  }

  if (rect) {
    const isInRect =
      r.x >= rect[0] &&
      r.x < rect[0] + rect[2] &&
      r.y >= rect[1] &&
      r.y < rect[1] + rect[3] &&
      r.x + r.width > rect[0] &&
      r.x + r.width <= rect[0] + rect[2] &&
      r.y + r.height > rect[1] &&
      r.y + r.height <= rect[1] + rect[3]
    if (!isInRect) return false
  }

  if (excludeRects?.length) {
    const rRight = r.x + r.width
    const rBottom = r.y + r.height
    for (const e of excludeRects) {
      const eRight = e[0] + e[2]
      const eBottom = e[1] + e[3]
      if (
        r.x >= e[0] &&
        r.y >= e[1] &&
        rRight <= eRight &&
        rBottom <= eBottom
      ) {
        return false
      }
    }
  }

  return filterLayers(lyr)
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

function rankAndPaginate(
  layers: HtmlLayer[],
  rect?: [number, number, number, number],
  excludeRects?: [number, number, number, number][],
  limit?: number,
  offset?: number
) {
  let filtered = layers.filter(l => filterLayersByRect(l, rect, excludeRects))

  filtered.sort((a, b) => {
    const scoreA = calculateLayoutScore(a.rect ?? {})
    const scoreB = calculateLayoutScore(b.rect ?? {})
    return scoreB - scoreA
  })

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
  images?: Array<{ path: string; data: Buffer }>
) {
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
          const destPath = path.join(dest, path.basename(normalizedPath))
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

async function processPreview(
  artboard: HtmlSketchArtboard,
  filePath: string,
  rect?: [number, number, number, number],
  excludeRects?: [number, number, number, number][],
  images?: Array<{ path: string; data: Buffer }>
) {
  if (!artboard.previewPath) return

  const parsed = path.parse(filePath)
  const imageData = images?.find(item =>
    item.path.endsWith(artboard.previewPath!)
  )?.data
  if (!imageData) return

  const extname = path.extname(artboard.previewPath)
  const fileName = path.basename(artboard.previewPath, extname)
  const dest = path.join(
    parsed.dir,
    `${parsed.name}.cache`,
    `${fileName}${rect ? `_${rect.join('_')}` : ''}${excludeRects?.length ? `_exclude_${excludeRects.map(r => r.join('_')).join('-')}` : ''}${extname}`
  )
  artboard.previewPath = await processImage(
    imageData,
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
  const dest = args.assets_path ?? 'src/assets/sketch'
  const newRect = getRect(args.rect)
  const newExcludeRects = args.exclude_rects?.reduce<
    [number, number, number, number][]
  >((acc, r) => {
    const rect = getRect(r)
    if (rect) acc.push(rect)
    return acc
  }, [])

  const filtered = rankAndPaginate(
    artboard.layers,
    newRect,
    newExcludeRects,
    args.limit,
    args.offset
  )

  const newArtboard: HtmlSketchArtboard = {
    previewPath: artboard.imagePath ? normalize(artboard.imagePath) : undefined,
    pageName: artboard.pageName,
    pageObjectID: artboard.pageObjectID,
    name: artboard.name,
    objectID: artboard.objectID,
    width: artboard.width,
    height: artboard.height,
    layers: filtered.map(toSketchLayer)
  }

  await compressAssets(filtered, newArtboard.layers, dest, images)
  await processPreview(
    newArtboard,
    args.file_path,
    newRect,
    newExcludeRects,
    images
  )

  return newArtboard
}
