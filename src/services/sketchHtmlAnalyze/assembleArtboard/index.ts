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
import { isNumber, roundIfExceeds } from '@/utils/util'

function filterLayers(lyr: HtmlLayer) {
  return (
    (lyr.type === 'slice' && !!lyr.exportable?.length) ||
    lyr.type === 'text' ||
    (lyr.type === 'shape' &&
      !!lyr.radius?.length &&
      lyr.css?.some(s => s.includes('background') || s.includes('border')))
  )
}

function filterLayersByRect(
  lyr: HtmlLayer,
  rect?: [number, number, number, number]
) {
  if (!rect) {
    return filterLayers(lyr)
  } else {
    return (
      lyr.rect?.x !== undefined &&
      lyr.rect?.y !== undefined &&
      lyr.rect.x >= rect[0] &&
      lyr.rect.x < rect[0] + rect[2] &&
      lyr.rect.y >= rect[1] &&
      lyr.rect.y < rect[1] + rect[3] &&
      filterLayers(lyr)
    )
  }
}

export function assembleArtboard(
  artboard: HtmlArtboard,
  assetsPath?: string,
  rect?: number[],
  images?: Array<{
    path: string
    data: Buffer
  }>
) {
  const dest = assetsPath ?? 'src/assets/sketch'
  let previewPath = ''
  let newRect: [number, number, number, number] | undefined
  if (rect?.length === 4 && rect.every(r => isNumber(r))) {
    newRect = [
      Number(rect[0]),
      Number(rect[1]),
      Number(rect[2]),
      Number(rect[3])
    ]
  }
  const newArtboard: HtmlSketchArtboard = {
    pageName: artboard.pageName,
    pageObjectID: artboard.pageObjectID,
    name: artboard.name,
    objectID: artboard.objectID,
    width: artboard.width,
    height: artboard.height,
    layers: artboard.layers
      .filter(l => filterLayersByRect(l, newRect))
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
              saveImage(imageData, dest, fileName).catch(error => {
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

  return { artboard: newArtboard, previewPath }
}
