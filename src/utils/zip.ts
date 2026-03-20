import { Open } from 'unzipper'
import type Sketch from '@sketch-hq/sketch-file-format-ts'
import type { Layer } from '@/types'

/**
 * sketch文件
 */
export interface SketchFile {
  /**
   * meta.json文件内容
   */
  metaJson: string
  /**
   * pages文件内容
   * key: 页面路径
   * value: 页面json内容
   */
  pagesJson: Map<string, string>
  /**
   * images文件内容
   * key: 图片路径
   * value: 图片数据
   */
  images: Map<string, Buffer>
  /**
   * symbolMasters文件内容
   * key: symbolID
   * value: symbol对象
   */
  symbolMasters: Map<string, string>
}

export const METAJSON = 'meta.json'
export const PAGEFOLDER = 'pages'
export const IMAGEFOLDER = 'images'

/**
 * 从页面json中提取所有symbolMaster
 * @param pageJson - 页面json内容
 * @returns - symbolMaster列表
 */
function filterSymbolMaster(pageJson: string) {
  const symbolMasters: Sketch.SymbolMaster[] = []
  const page = JSON.parse(pageJson) as Sketch.Page
  if (page.layers?.length) {
    const stack: Layer[] = []

    for (let i = page.layers.length - 1; i >= 0; i--) {
      stack.push(page.layers[i])
    }

    while (stack.length > 0) {
      const current = stack.pop()!

      if (current._class === 'symbolMaster') {
        symbolMasters.push(current)
      }

      if (
        (current._class === 'artboard' ||
          current._class === 'group' ||
          current._class === 'shapeGroup') &&
        current.layers?.length
      ) {
        for (let i = current.layers.length - 1; i >= 0; i--) {
          stack.push(current.layers[i])
        }
      }
    }
  }
  return symbolMasters
}

/**
 * 全量提取sketch文件中的所有symbolMaster后，处理symbolMaster内包含symbolInstance的情况
 * 1. 遍历所有symbolMaster，递归迭代layers检查是否包含symbolInstance
 * 2. 如果包含symbolInstance，找到对应的symbolMaster，替换symbolInstance
 * 3. 读取SymbolInstance.overrides动态修改该节点的属性（文本内容、填充颜色、是否隐藏、图片源等）
 * 4. 如果找到的symbolMaster还包含symbolInstance，递归处理
 * @param symbolMasters
 */
// function assembleSymbolMasters(
//   symbolMasters: Map<string, Sketch.SymbolMaster>
// ) {}

/**
 * 打开sketch文件, 并解析meta.json和pages/*.json, 提取所有图片和symbolMasters
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
  const symbolMasters = new Map<string, string>()

  for (const file of directory.files) {
    if (file.path.startsWith(`${PAGEFOLDER}/`) && file.path.endsWith('.json')) {
      const pageJson = (await file.buffer()).toString('utf8')
      const symbolMastersInPage = filterSymbolMaster(pageJson)
      if (symbolMastersInPage.length) {
        symbolMastersInPage.forEach(symbolMaster => {
          symbolMasters.set(symbolMaster.symbolID, JSON.stringify(symbolMaster))
        })
      }
      pagesJson.set(file.path, pageJson)
    } else if (file.path.startsWith(`${IMAGEFOLDER}/`)) {
      const buffer = await file.buffer()
      images.set(file.path, buffer)
    }
  }

  return {
    metaJson,
    pagesJson,
    images,
    symbolMasters
  }
}
