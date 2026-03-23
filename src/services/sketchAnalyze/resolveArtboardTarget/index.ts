import { logger } from '@/utils/logger'
import type Sketch from '@sketch-hq/sketch-file-format-ts'
import type { InputSchema, Layer } from '@/types'
import { METAJSON, PAGEFOLDER, type SketchFile } from '@/utils/zip'

/**
 * 锁定的节点信息
 */
export interface NodeInfo {
  layers: Layer[]
  artboardId: string
  pageId: string
  nodeId?: string
}

/**
 * 画板
 */
interface Artboard {
  id: string
  name: string
}

/**
 * 页面
 */
interface Page extends Artboard {
  artboards: Artboard[]
}

/**
 * 获取指定ID或名称的对象
 * @param list - d数组
 * @param id - ID(可选)
 * @param name - 名称(可选)
 * @returns - 指定ID或名称的对象
 */
function getData<T extends Artboard>(
  list: T[],
  id?: string,
  name?: string
): T | undefined {
  if (id) {
    const data = list.find(item => item.id === id)
    if (!data) {
      throw new Error(`Sketch Artboard ${id} not found`)
    }
    return data
  }
  if (name) {
    const data = list.find(item => item.name === name)
    if (!data) {
      throw new Error(`Sketch Artboard ${name} not found`)
    }
    return data
  }
  return undefined
}

/**
 * 迭代锁定Artboard内目标节点
 * @param layers - 画板图层
 * @param value - 目标节点值
 * @param key - 目标节点键
 * @returns - 目标节点数组
 */
function getNode(
  layers: Layer[],
  value: string,
  key: 'do_objectID' | 'name'
): Layer | undefined {
  const stack: Layer[] = []

  for (let i = layers.length - 1; i >= 0; i--) {
    stack.push(layers[i])
  }

  while (stack.length > 0) {
    const current = stack.pop()!

    if (current[key] === value) {
      return current
    }

    if (
      (current._class === 'group' || current._class === 'shapeGroup') &&
      current.layers?.length
    ) {
      for (let i = current.layers.length - 1; i >= 0; i--) {
        stack.push(current.layers[i])
      }
    }
  }

  return undefined
}

/**
 * 锁定Artboard
 * @param metaJson - meta内容
 * @param args - sketch文件分析参数
 * @returns - Artboard Id
 */
function getArtboard(metaJson: string, args: InputSchema) {
  if (!metaJson) {
    throw new Error(`Sketch ${METAJSON} not found`)
  }
  let meta: Sketch.Meta
  try {
    meta = JSON.parse(metaJson) as Sketch.Meta
  } catch (error) {
    logger.error(error, `Sketch ${METAJSON} format error`)
    throw new Error(`Sketch ${METAJSON} format error`)
  }
  if (!meta?.pagesAndArtboards) {
    throw new Error(`Sketch ${METAJSON} format error`)
  }
  const pagesAndArtboards: Page[] = Object.keys(meta.pagesAndArtboards).map(
    id => {
      const page = meta.pagesAndArtboards[id]
      return {
        id,
        name: page.name,
        artboards: page.artboards
          ? Object.keys(page.artboards).map(artboard_id => {
              const artboard = page.artboards[artboard_id]
              return {
                id: artboard_id,
                name: artboard.name
              }
            })
          : []
      }
    }
  )
  let page = getData(pagesAndArtboards, args.page_id, args.page_name)
  if (!page) {
    page = pagesAndArtboards[0]
    if (!page) {
      throw new Error(`Sketch ${METAJSON} format error`)
    }
  }
  let artboard = getData(page.artboards, args.artboard_id, args.artboard_name)
  if (!artboard) {
    artboard = page.artboards[0]
    if (!artboard) {
      throw new Error(`Sketch Page ${page.name || page.id} not found`)
    }
  }
  return { artboard, pageId: page.id }
}

/**
 * 锁定Artboard内目标节点
 * @param pageId - 页面ID
 * @param pageJson - 页面JSON
 * @param args - sketch文件分析参数
 * @param artboardId - 目标画板ID
 * @returns - 目标节点
 */
function getArtboardNode(
  pageId: string,
  pageJson: string,
  args: InputSchema,
  artboardId: string
): NodeInfo {
  if (!pageJson) {
    throw new Error(`Sketch Page ${pageId} is empty`)
  }
  let page: Sketch.Page
  try {
    page = JSON.parse(pageJson) as Sketch.Page
  } catch (error) {
    logger.error(error, `Sketch Page format error`)
    throw new Error(`Sketch Page format error`)
  }
  if (!page?.layers) {
    throw new Error(`Sketch Page format error`)
  }
  const artboard = page.layers.find(
    l => l._class === 'artboard' && l.do_objectID === artboardId
  ) as Sketch.Artboard | undefined
  if (!artboard) {
    throw new Error(`Sketch Artboard ${artboardId} not found`)
  }
  if (args.node_id) {
    const node = getNode(artboard.layers, args.node_id, 'do_objectID')
    if (!node) {
      throw new Error(
        `Sketch Artboard ${artboard.name ?? artboard.do_objectID}/${args.node_id} not found`
      )
    }
    return {
      layers: [node],
      artboardId: artboard.do_objectID,
      pageId,
      nodeId: node.do_objectID
    }
  }
  if (args.node_name) {
    const node = getNode(artboard.layers, args.node_name, 'name')
    if (!node) {
      throw new Error(
        `Sketch Artboard ${artboard.name ?? artboard.do_objectID}/${args.node_name} not found`
      )
    }
    return {
      layers: [node],
      artboardId: artboard.do_objectID,
      pageId,
      nodeId: node.do_objectID
    }
  }
  return {
    layers: artboard.layers,
    artboardId: artboard.do_objectID,
    pageId
  }
}

/**
 * 解析skecth并锁定目标节点
 * 1、打开 Sketch 文件，先读取 meta.json，快速提取所有 Page 和 Artboard 的 {id, name} 列表。
 * 2、根据 page_id/page_name 锁定目标 Page，若未指定则默认取第一个 Page。若指定了 page_id/page_name 但未找到，则返回具体错误信息。
 * 3、根据 artboard_id/artboard_name 锁定目标 Artboard，若未指定则默认取第一个 Artboard。若指定了 artboard_id/artboard_name 但未找到，则返回具体错误信息。
 * 4、根据 node_id/node_name 锁定目标 Node，若未指定则默认取 Artboard 内所有 Node。若指定了 node_id/node_name 但未找到，则返回具体错误信息。
 * @param {InputSchema} args - sketch文件分析参数
 * @property {string} file_path - sketch文件路径(必填)
 * @property {string} page_id - 指定页面ID(可选)
 * @property {string} page_name - 指定页面名称(可选)
 * @property {string} artboard_id - 指定画板ID(可选)
 * @property {string} artboard_name - 指定画板名称(可选)
 * @property {string} node_id - 指定节点ID(可选)
 * @property {string} node_name - 指定节点名称(可选)
 * @property {string} assets_path - 指定静态资源存放路径(可选)，默认src/assets/sketch
 * @param {SketchFile} sketchFile - sketch文件对象
 */
export function resolveArtboardTarget(
  args: InputSchema,
  sketchFile: SketchFile
) {
  const artboardInfo = getArtboard(sketchFile.metaJson, args)
  const pageJson = sketchFile.pagesJson.get(
    `${PAGEFOLDER}/${artboardInfo.pageId}.json`
  )
  return getArtboardNode(
    artboardInfo.pageId,
    pageJson ?? '',
    args,
    artboardInfo.artboard.id
  )
}
