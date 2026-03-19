import { z } from 'zod/v4'
import type AdmZip from 'adm-zip'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { logger } from '@/utils/logger'
import type Sketch from '@sketch-hq/sketch-file-format-ts'
import type { Layer } from '@/types'

/**
 * 解析skecth文件分析参数
 */
export const inputSchema = z.object({
  file_path: z.string().describe('sketch文件路径'),
  page_id: z.string().describe('指定页面ID(可选)').optional(),
  page_name: z.string().describe('指定页面名称(可选)').optional(),
  artboard_id: z.string().describe('指定画板ID(可选)').optional(),
  artboard_name: z.string().describe('指定画板名称(可选)').optional(),
  node_id: z.string().describe('指定节点ID(可选)').optional(),
  node_name: z.string().describe('指定节点名称(可选)').optional(),
  assets_path: z
    .string()
    .describe('指定静态资源存放路径(可选)，默认src/assets/sketch')
    .optional()
})

/**
 * 解析skecth文件分析参数类型
 * @property {string} file_path - sketch文件路径(必填)
 * @property {string} page_id - 指定页面ID(可选)
 * @property {string} page_name - 指定页面名称(可选)
 * @property {string} artboard_id - 指定画板ID(可选)
 * @property {string} artboard_name - 指定画板名称(可选)
 * @property {string} node_id - 指定节点ID(可选)
 * @property {string} node_name - 指定节点名称(可选)
 * @property {string} assets_path - 指定静态资源存放路径(可选)，默认src/assets/sketch
 */
export type InputSchema = SchemaOutput<typeof inputSchema>

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

const METAJSON = 'meta.json'
const PAGEFOLDER = 'pages'

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
      throw new Error(`Sketch 解析失败： ${id} 不存在！`)
    }
    return data
  }
  if (name) {
    const data = list.find(item => item.name === name)
    if (!data) {
      throw new Error(`Sketch 解析失败： ${name} 不存在！`)
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
    throw new Error(`Sketch 解析失败： ${METAJSON} 不存在！`)
  }
  let meta: Sketch.Meta
  try {
    meta = JSON.parse(metaJson) as Sketch.Meta
  } catch (error) {
    logger.error(error, `Sketch 解析失败： ${METAJSON} 格式错误！`)
    throw new Error(`Sketch 解析失败： ${METAJSON} 格式错误！`)
  }
  if (!meta?.pagesAndArtboards) {
    throw new Error(`Sketch 解析失败： ${METAJSON} 格式错误！`)
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
      throw new Error(`Sketch 解析失败：设计内容为空！`)
    }
  }
  let artboard = getData(page.artboards, args.artboard_id, args.artboard_name)
  if (!artboard) {
    artboard = page.artboards[0]
    if (!artboard) {
      throw new Error(
        `Sketch 解析失败：${page.name || page.id}页面内画板为空！`
      )
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
    throw new Error(`Sketch 解析失败： 页面数据读取失败！`)
  }
  let page: Sketch.Page
  try {
    page = JSON.parse(pageJson) as Sketch.Page
  } catch (error) {
    logger.error(error, `Sketch 解析失败： 页面数据格式错误！`)
    throw new Error(`Sketch 解析失败： 页面数据格式错误！`)
  }
  if (!page?.layers) {
    throw new Error(`Sketch 解析失败： 页面数据格式错误！`)
  }
  const artboard = page.layers.find(
    l => l._class === 'artboard' && l.do_objectID === artboardId
  ) as Sketch.Artboard | undefined
  if (!artboard) {
    throw new Error(`Sketch 解析失败： 画板 ${artboardId} 不存在！`)
  }
  if (args.node_id) {
    const node = getNode(artboard.layers, args.node_id, 'do_objectID')
    if (!node) {
      throw new Error(
        `Sketch 解析失败：${artboard.name ?? artboard.do_objectID}内${args.node_id}不存在！`
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
        `Sketch 解析失败：${artboard.name ?? artboard.do_objectID}内${args.node_name}不存在！`
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
 * @param {AdmZip} zip - sketch文件zip对象
 * @property {string} file_path - sketch文件路径(必填)
 * @property {string} page_id - 指定页面ID(可选)
 * @property {string} page_name - 指定页面名称(可选)
 * @property {string} artboard_id - 指定画板ID(可选)
 * @property {string} artboard_name - 指定画板名称(可选)
 * @property {string} node_id - 指定节点ID(可选)
 * @property {string} node_name - 指定节点名称(可选)
 * @property {string} assets_path - 指定静态资源存放路径(可选)，默认src/assets/sketch
 */
export function resolveArtboardTarget(args: InputSchema, zip: AdmZip) {
  logger.debug(args, 'resolveArtboardTarget')
  const metaJson = zip.readAsText(METAJSON)
  const artboardInfo = getArtboard(metaJson, args)
  const pageJson = zip.readAsText(`${PAGEFOLDER}/${artboardInfo.pageId}.json`)
  return getArtboardNode(
    artboardInfo.pageId,
    pageJson,
    args,
    artboardInfo.artboard.id
  )
}
