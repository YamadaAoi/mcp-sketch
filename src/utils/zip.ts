import { Open } from 'unzipper'

/**
 * sketch文件
 */
export interface SketchFile {
  metaJson: string
  pagesJson: Map<string, string>
  images: Map<string, Buffer>
}

export const METAJSON = 'meta.json'
export const PAGEFOLDER = 'pages'
export const IMAGEFOLDER = 'images'

/**
 * 打开sketch文件, 并解析meta.json和pages/*.json, 同时提取所有图片
 * @param filePath - sketch文件路径
 * @returns - sketch文件内容
 */
export async function openSketchFile(filePath: string): Promise<SketchFile> {
  const directory = await Open.file(filePath)

  const metaJsonEntry = directory.files.find(f => f.path === METAJSON)
  const metaJson = metaJsonEntry
    ? (await metaJsonEntry.buffer()).toString('utf8')
    : ''

  const pagesJson = new Map<string, string>()
  const images = new Map<string, Buffer>()

  for (const file of directory.files) {
    if (file.path.startsWith(`${PAGEFOLDER}/`) && file.path.endsWith('.json')) {
      const buffer = await file.buffer()
      pagesJson.set(file.path, buffer.toString('utf8'))
    } else if (file.path.startsWith(`${IMAGEFOLDER}/`)) {
      const buffer = await file.buffer()
      images.set(file.path, buffer)
    }
  }

  return {
    metaJson,
    pagesJson,
    images
  }
}
