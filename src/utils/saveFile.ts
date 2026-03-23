import path from 'path'
import fs from 'fs/promises'

/**
 * 写入json文件，若文件夹不存在则创建，文件存在则覆盖
 * @param filePath - json文件路径
 * @param data - 要写入的数据
 * @param compress - 是否压缩JSON文件(可选)，默认true
 */
export async function writeJsonFile(
  filePath: string,
  data: object,
  compress: boolean = true
) {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  const jsonString = compress
    ? JSON.stringify(data)
    : JSON.stringify(data, null, 2)
  await fs.writeFile(filePath, jsonString, 'utf8')
}

/**
 * 保存图片文件
 * @param data - 图片数据
 * @param dest - 保存路径
 * @param fileName - 保存文件名
 */
export async function saveImage(data: Buffer, dest: string, fileName: string) {
  await fs.mkdir(dest, { recursive: true })
  const targetPath = path.join(dest, fileName)
  await fs.writeFile(targetPath, data)
}
