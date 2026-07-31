import path from 'path'
import fs from 'fs/promises'
import { constants } from 'fs'
import { getSharp } from './imageProcessor'

export async function fileExists(filePath: string) {
  return fs
    .access(filePath, constants.F_OK)
    .then(() => true)
    .catch(() => false)
}

/**
 * 判断缓存文件是否比源文件新（缓存未被源文件更新后写过）
 * 源文件或缓存文件不存在时返回 false，视为缓存失效
 * @param cachePath - 缓存文件路径
 * @param sourcePath - 源文件路径
 */
export async function isFileNewerThan(cachePath: string, sourcePath: string) {
  const [cacheStat, sourceStat] = await Promise.all([
    fs.stat(cachePath).catch(() => undefined),
    fs.stat(sourcePath).catch(() => undefined)
  ])
  if (!cacheStat || !sourceStat) return false
  return cacheStat.mtimeMs >= sourceStat.mtimeMs
}

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
 * 若目标路径已存在文件则跳过处理，优先检查webp格式，再检查原始格式
 * @param data - 图片数据
 * @param dest - 保存路径
 * @param width - 图片宽度，用于缩放
 * @param rect - 截取区域
 * @returns 实际文件路径（可能为已存在的webp或原始文件）
 */
export async function processImage(
  data: Buffer,
  dest: string,
  width?: number,
  rect?: [number, number, number, number]
) {
  const parsed = path.parse(dest)
  const webpPath = path.join(parsed.dir, `${parsed.name}.webp`)

  // 已处理过则跳过：优先返回 webp，其次返回原始文件
  if (await fileExists(webpPath)) return webpPath
  if (await fileExists(dest)) return dest

  await fs.mkdir(parsed.dir, { recursive: true })
  const sharp = await getSharp()
  if (sharp) {
    const img = sharp(data)
    if (width) {
      img.resize({ width })
    }
    if (rect) {
      img.extract({
        left: rect[0],
        top: rect[1],
        width: rect[2],
        height: rect[3]
      })
    }
    await img.webp({ quality: 90, effort: 4 }).toFile(webpPath)
    return webpPath
  }

  await fs.writeFile(dest, data)
  return dest
}
