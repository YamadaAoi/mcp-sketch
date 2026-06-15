import path from 'path'
import {
  normalize,
  type HtmlArtboard,
  type HtmlLayer,
  type HtmlSketchArtboard,
  type HtmlSketchLayer
} from '@/utils/zip'
import { saveImage } from '@/utils/saveFile'
import { logger } from '@/utils/logger'
import { getRect, roundIfExceeds } from '@/utils/util'

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

  // 判断图层是否在 rect 内
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

  // 判断图层是否完全包含在任意 excludeRect 内
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

export function assembleArtboard(
  artboard: HtmlArtboard,
  assetsPath?: string,
  rect?: number[],
  excludeRects?: number[][],
  images?: Array<{
    path: string
    data: Buffer
  }>
) {
  const dest = assetsPath ?? 'src/assets/sketch'
  let previewPath = ''
  const newRect = getRect(rect)
  const newExcludeRects = excludeRects?.reduce<
    [number, number, number, number][]
  >((acc, r) => {
    const rect = getRect(r)
    if (rect) acc.push(rect)
    return acc
  }, [])
  const newArtboard: HtmlSketchArtboard = {
    pageName: artboard.pageName,
    pageObjectID: artboard.pageObjectID,
    name: artboard.name,
    objectID: artboard.objectID,
    width: artboard.width,
    height: artboard.height,
    layers: artboard.layers
      .filter(l => filterLayersByRect(l, newRect, newExcludeRects))
      .map(l => {
        const lyr: HtmlSketchLayer = {
          type: l.type,
          name: l.name,
          rect: {
            x: roundIfExceeds(l.rect?.x),
            y: roundIfExceeds(l.rect?.y),
            w: roundIfExceeds(l.rect?.width),
            h: roundIfExceeds(l.rect?.height)
          }
        }
        if (l.styleName) {
          lyr.styleName = l.styleName
        }
        if (l.css?.length) {
          lyr.css = l.css
        }
        if (l.exportable?.length) {
          lyr.assets = l.exportable.map(e => {
            let imagePath = ''
            const normalizedPath = normalize(e.path)
            const imageData = images?.find(item =>
              item.path.endsWith(normalizedPath)
            )?.data
            if (imageData) {
              const fileName = path.basename(normalizedPath)
              imagePath = path.join(dest, fileName)
              saveImage(imageData, imagePath).catch(error => {
                logger.error(`Failed to save image ${normalizedPath}: ${error}`)
              })
            }
            return {
              ...e,
              path: imagePath
            }
          })
        }
        return lyr
      })
  }

  if (artboard.imagePath) {
    previewPath = normalize(artboard.imagePath)
  }

  return { previewPath, artboard: newArtboard }
}
