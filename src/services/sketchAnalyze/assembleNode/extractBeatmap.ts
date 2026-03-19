import type Sketch from '@sketch-hq/sketch-file-format-ts'
import AdmZip from 'adm-zip'
import { promises as fs } from 'fs'
import path from 'path'
import type { InputSchema } from '../resolveArtboardTarget'
import { logger } from '@/utils/logger'

/**
 * 从Sketch文件中提取图片，先实现提取MSJSONFileReference类型
 * @param image
 * @param zip
 * @param dest
 * @param targetPath
 */
async function extractImage(
  image: Sketch.FileRef | Sketch.DataRef,
  zip: AdmZip,
  dest: string,
  targetPath: string
) {
  await fs.mkdir(dest, { recursive: true })

  if (image._class === 'MSJSONFileReference' && image._ref) {
    zip.extractEntryTo(image._ref, targetPath, false, true)
  }
}

/**
 * 从Sketch文件中提取图片，先实现提取MSJSONFileReference类型
 * 先拼接图片存储目标路径，拼接规则为：存储路径/文件名.扩展名
 * @param image
 * @param args
 * @param zip
 * @returns
 */
export function extractBeatmap(
  image: Sketch.FileRef | Sketch.DataRef,
  args: InputSchema,
  zip: AdmZip
): string {
  const dest = args.assets_path || 'src/assets/sketch'
  let targetPath = ''

  if (image._class === 'MSJSONFileReference' && image._ref) {
    const fileName = path.basename(image._ref)
    targetPath = path.join(dest, fileName)
  }

  if (targetPath) {
    extractImage(image, zip, dest, targetPath).catch(() => {
      logger.error(
        `Failed to extract zip entry: ${image._ref} to ${targetPath}`
      )
    })
  }

  return targetPath
}
