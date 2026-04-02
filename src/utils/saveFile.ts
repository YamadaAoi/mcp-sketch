import path from 'path'
import fs from 'fs/promises'
import { getSharp } from './imageProcessor'

/**
 * 写入json文件，若文件夹不存在则创建，文件存在则覆盖
 * @param filePath - json文件路径
 * @param data - 要写入的数据
 */
export async function writeJsonFile(filePath: string, data: object) {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  const jsonString = JSON.stringify(data, null, 2)
  await fs.writeFile(filePath, jsonString, 'utf8')
}

/**
 * 保存图片文件
 * @param data - 图片数据
 * @param dest - 保存路径
 */
export async function saveImage(data: Buffer, dest: string) {
  const dirPath = path.dirname(dest)
  await fs.mkdir(dirPath, { recursive: true })
  await fs.writeFile(dest, data)
}

/**
 * 处理图片，保存为webp格式
 * 如果sharp不可用，直接保存原始图片
 * @param data - 图片数据
 * @param dest - 保存路径
 * @param width - 图片宽度，用于缩放
 * @param rect - 截取区域
 */
export async function processImage(
  data: Buffer,
  dest: string,
  width?: number,
  rect?: [number, number, number, number]
) {
  const parsed = path.parse(dest)
  await fs.mkdir(parsed.dir, { recursive: true })
  const sharp = await getSharp()
  if (sharp) {
    const img = sharp(data)
    if (width) {
      img.resize({
        width
      })
    }
    if (rect) {
      img.extract({
        left: rect[0],
        top: rect[1],
        width: rect[2],
        height: rect[3]
      })
    }
    const webpPath = path.join(parsed.dir, `${parsed.name}.webp`)
    await img
      .webp({
        quality: 90,
        effort: 4
      })
      .toFile(webpPath)
    return webpPath
  } else {
    await fs.writeFile(dest, data)
    return dest
  }
}
