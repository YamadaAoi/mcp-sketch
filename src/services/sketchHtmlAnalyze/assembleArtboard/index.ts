import path from 'path'
import {
  normalize,
  type HtmlArtboard,
  type HtmlSketchArtboard,
  type HtmlSketchLayer
} from '@/utils/zip'
import { saveImage } from '@/utils/saveFile'
import { logger } from '@/utils/logger'
import { roundIfExceeds } from '@/utils/util'

export function assembleArtboard(
  artboard: HtmlArtboard,
  assetsPath?: string,
  images?: Array<{
    path: string
    data: Buffer
  }>
) {
  const dest = assetsPath ?? 'src/assets/sketch'
  let previewPath = ''
  const newArtboard: HtmlSketchArtboard = {
    pageName: artboard.pageName,
    pageObjectID: artboard.pageObjectID,
    name: artboard.name,
    objectID: artboard.objectID,
    width: artboard.width,
    height: artboard.height,
    layers: artboard.layers
      .filter(
        l =>
          (l.type === 'slice' && !!l.exportable?.length) ||
          l.type === 'text' ||
          (l.type === 'shape' &&
            !!l.radius?.length &&
            l.css?.some(s => s.includes('background') || s.includes('border')))
      )
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
