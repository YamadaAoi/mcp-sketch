import type Sketch from '@sketch-hq/sketch-file-format-ts'
import fs from 'fs/promises'
import path from 'path'
import type { InputSchema } from '../resolveArtboardTarget'
import { logger } from '@/utils/logger'
import type { SketchFile } from '@/utils/zip'

/**
 * 保存图片到指定路径
 * @param imagePath - 图片路径
 * @param data - 图片数据
 * @param dest - 存储路径
 */
async function saveImage(imagePath: string, data: Buffer, dest: string) {
  await fs.mkdir(dest, { recursive: true })
  const fileName = path.basename(imagePath)
  const targetPath = path.join(dest, fileName)
  await fs.writeFile(targetPath, data)
}

/**
 * 从Sketch文件中提取图片，先实现提取MSJSONFileReference类型
 * 先拼接图片存储目标路径，拼接规则为：存储路径/文件名.扩展名
 * @param image - 图片引用
 * @param args - sketch文件分析参数
 * @param sketchFile - sketch文件内容
 * @returns - 图片路径
 */
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
      saveImage(image._ref, imageData, dest).catch(error => {
        logger.error(`Failed to save image ${image._ref}: ${error}`)
      })
    }
  }

  return imagePath
}
