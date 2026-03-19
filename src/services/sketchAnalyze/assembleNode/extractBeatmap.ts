import type Sketch from '@sketch-hq/sketch-file-format-ts'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import type { InputSchema } from '../resolveArtboardTarget'
import { logger } from '@/utils/logger'
import type { SketchFile } from '@/utils/zip'

const MIME_TO_EXT: Record<string, string> = {
  '/9j/': 'jpg',
  iVBOR: 'png',
  R0lGO: 'gif',
  UklGR: 'webp'
}

function detectImageFormat(base64Data: string): string {
  const header = base64Data.substring(0, 10)
  for (const [sig, ext] of Object.entries(MIME_TO_EXT)) {
    if (header.startsWith(sig)) {
      return ext
    }
  }
  return 'png'
}

async function saveImage(data: Buffer, dest: string, fileName: string) {
  await fs.mkdir(dest, { recursive: true })
  const targetPath = path.join(dest, fileName)
  await fs.writeFile(targetPath, data)
}

export function extractBeatmap(
  image: Sketch.FileRef | Sketch.DataRef,
  args: InputSchema,
  sketchFile: SketchFile
): string {
  const dest = args.assets_path || 'src/assets/sketch'
  let imagePath = ''

  if (image._class === 'MSJSONFileReference' && image._ref) {
    const imageData = sketchFile.images.get(image._ref)
    if (imageData) {
      imagePath = path.join(dest, path.basename(image._ref))
      saveImage(imageData, dest, path.basename(image._ref)).catch(error => {
        logger.error(`Failed to save image ${image._ref}: ${error}`)
      })
    }
  }

  if (image._class === 'MSJSONOriginalDataReference') {
    const dataRef = image
    if (dataRef.data?._data) {
      const base64Data = dataRef.data._data
      const imageBuffer = Buffer.from(base64Data, 'base64')

      let fileName: string
      if (dataRef._ref_class === 'MSImageData') {
        const sha1Hash =
          dataRef.sha1?._data ||
          crypto.createHash('sha1').update(imageBuffer).digest('hex')
        const ext = detectImageFormat(base64Data)
        fileName = `${sha1Hash}.${ext}`
      } else if (dataRef._ref_class === 'MSFontData') {
        const sha1Hash =
          dataRef.sha1?._data ||
          crypto.createHash('sha1').update(imageBuffer).digest('hex')
        fileName = `${sha1Hash}.ttf`
      } else {
        const sha1Hash =
          dataRef.sha1?._data ||
          crypto.createHash('sha1').update(imageBuffer).digest('hex')
        fileName = `${sha1Hash}.bin`
      }

      imagePath = path.join(dest, fileName)
      saveImage(imageBuffer, dest, fileName).catch(error => {
        logger.error(`Failed to save DataRef image: ${error}`)
      })
    }
  }

  return imagePath
}
