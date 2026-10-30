import fs from 'fs/promises'
import path from 'path'
import { Open } from 'unzipper'
import * as cheerio from 'cheerio'
import { parse } from '@babel/parser'
import { type Node } from '@babel/traverse'
import { generate } from '@babel/generator'
import { logger } from '@/utils/logger'
import { getEnv } from '@/utils/env'
import { getSafeTraverse } from './getTraverse'

interface UnifiedFile {
  path: string
  buffer(): Promise<Buffer>
}

interface UnifiedDirectory {
  files: UnifiedFile[]
}

interface HtmlData {
  artboards: HtmlArtboard[]
}

export interface HtmlLayer {
  type: string
  name: string
  rect: {
    x?: number
    y?: number
    width?: number
    height?: number
  }
  styleName?: string
  fills?: unknown[]
  borders?: unknown[]
  css?: string[]
  radius?: number[]
  exportable?: Array<{
    name: string
    format: string
    path: string
  }>
}

export interface HtmlArtboard {
  pageName: string
  pageObjectID: string
  name: string
  objectID: string
  width: number
  height: number
  layers: HtmlLayer[]
  imagePath?: string
}

/**
 * 解析后的layer数据
 */
export interface HtmlSketchLayer {
  type: string
  name: string
  rect: [number | string, number | string, number | string, number | string]
  styleName?: string
  css?: string[]
  assets?: Array<{
    name: string
    format: string
    path: string
  }>
}

/**
 * 解析后的artboard数据
 */
export interface HtmlSketchArtboard {
  pageName: string
  pageObjectID: string
  name: string
  objectID: string
  width: number
  height: number
  layers: HtmlSketchLayer[]
  previewPath?: string
}

export interface SketchImage {
  path: string
  getData: () => Promise<Buffer>
}

export interface SketchHtmlFile {
  data: HtmlData
  /**
   * images文件内容
   */
  images: SketchImage[]
}

const INDEXHTML = 'index.html'
const DATA_VAR_NAME = 'data'
const IMAGEFOLDER = 'assets'
const PREVIEWFOLDER = 'preview'
const traverse = getSafeTraverse()

/**
 * 过滤 macOS 打包产生的资源分叉垃圾（__MACOSX 目录与 ._ 开头的文件）
 */
function isAppleDoubleJunk(normalizedPath: string) {
  return (
    normalizedPath.startsWith('__MACOSX/') ||
    /(?:^|\/)\._[^/]*$/.test(normalizedPath)
  )
}

/**
 * 判断路径中是否包含指定的顶层资源文件夹（按路径段匹配，避免误伤同名前后缀的包裹文件夹）
 */
function isInFolder(normalizedPath: string, folder: string) {
  return new RegExp(`(?:^|/)${folder}/`).test(normalizedPath)
}

function getScriptFromHtml(html: string) {
  const $ = cheerio.load(html)
  const script = $('body#app').find('script').html()
  if (!script) {
    logger.error('script tag not found in body id="app"')
    throw new Error('script tag not found in body id="app"')
  }
  return script
}

function getDataFromScript(script: string) {
  let targetNode: Node | undefined

  const ast = parse(script, { sourceType: 'script' })
  traverse(ast, {
    VariableDeclarator(path) {
      if (
        path.node.id.type === 'Identifier' &&
        path.node.id.name === DATA_VAR_NAME
      ) {
        const init = path.node.init
        if (init && init.type === 'ObjectExpression') {
          targetNode = init
          path.stop() // 找到后停止遍历
        }
      }
    }
  })

  if (!targetNode) {
    logger.error(`"${DATA_VAR_NAME}" not found or not an object literal`)
    throw new Error(`"${DATA_VAR_NAME}" not found or not an object literal`)
  }

  const output = generate(targetNode, {
    compact: false,
    jsescOption: { json: true }
  })

  return output.code
}

/**
 * 规范路径（解码 URL 编码、统一分隔符）
 * 解码失败（如文件名含裸 %）时回退原文
 * @param p - 路径
 * @returns 规范后的路径
 */
export function normalize(p: string) {
  let decoded = p
  try {
    decoded = decodeURIComponent(p)
  } catch {
    // 含非法 URL 编码序列，保持原文
  }
  return decoded.replace(/\\/g, '/').replace(/\/+/g, '/')
}

async function readLocalDirectory(dirPath: string): Promise<UnifiedDirectory> {
  try {
    const stats = await fs.stat(dirPath)
    if (!stats.isDirectory()) {
      throw new Error(`传入的设计稿路径不是一个文件夹: ${dirPath}`)
    }
  } catch (err) {
    throw new Error(
      `无法读取设计稿路径，请检查路径是否存在: ${dirPath} (${(err as Error).message})`
    )
  }

  const files: UnifiedFile[] = []

  async function scan(currentPath: string, relativeBase: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)
      const relativePath = relativeBase
        ? `${relativeBase}/${entry.name}`
        : entry.name

      if (entry.isDirectory()) {
        await scan(fullPath, relativePath)
      } else {
        files.push({
          path: relativePath,
          buffer: () => fs.readFile(fullPath)
        })
      }
    }
  }

  await scan(dirPath, '')
  return { files }
}

/**
 * 计算设计稿的版本戳：zip 为文件 mtime，目录为内部文件（含子目录）的最新 mtime
 * 用于进程内解析缓存与 list.json 落盘缓存的失效判断
 * @param filePath - 设计稿路径（zip 或目录）
 * @returns 版本戳，路径不存在时返回 undefined
 */
export async function getDesignStamp(
  filePath: string
): Promise<number | undefined> {
  const stat = await fs.stat(filePath).catch(() => undefined)
  if (!stat) return undefined
  if (stat.isFile()) return stat.mtimeMs

  let latest = stat.mtimeMs
  const walk = async (dir: string) => {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const st = await fs.stat(fullPath).catch(() => undefined)
      if (!st) continue
      if (st.mtimeMs > latest) latest = st.mtimeMs
      if (st.isDirectory()) await walk(fullPath)
    }
  }
  await walk(filePath)
  return latest
}

/**
 * 设计稿解析结果的进程内缓存（key 为绝对路径），源文件未更新时复用，避免重复解压/解析
 * 按 FIFO（进入顺序）淘汰，上限由环境变量 DESIGN_MEMO_MAX 控制（默认 8）
 */
const sketchMemo = new Map<string, { stamp: number; value: SketchHtmlFile }>()

function evictMemoIfNeeded() {
  const max = getEnv('DESIGN_MEMO_MAX')
  while (sketchMemo.size >= max) {
    const oldest = sketchMemo.keys().next().value
    if (oldest === undefined) break
    sketchMemo.delete(oldest)
  }
}

export async function openSketchHtmlFile(filePath: string) {
  const key = path.resolve(filePath)
  const zipMode = filePath.endsWith('.zip')
  const stamp = await getDesignStamp(filePath)
  if (stamp === undefined) {
    throw new Error(`无法读取设计稿路径，请检查路径是否存在: ${filePath}`)
  }

  const hit = sketchMemo.get(key)
  if (hit && hit.stamp === stamp) return hit.value

  const directory: UnifiedDirectory = zipMode
    ? await Open.file(filePath)
    : await readLocalDirectory(filePath)

  const indexHtmlEntry = directory.files
    .map(f => ({ file: f, normalized: normalize(f.path) }))
    .find(
      ({ normalized }) =>
        !isAppleDoubleJunk(normalized) &&
        (normalized === INDEXHTML || normalized.endsWith(`/${INDEXHTML}`))
    )
  if (!indexHtmlEntry) {
    throw new Error(`${INDEXHTML} not found in ${filePath}`)
  }
  const indexHtml = (await indexHtmlEntry.file.buffer()).toString('utf8')
  const script = getScriptFromHtml(indexHtml)
  const sketchData = getDataFromScript(script)

  const data = JSON.parse(sketchData) as HtmlData

  const sketch: SketchHtmlFile = {
    data,
    images: []
  }

  for (const file of directory.files) {
    const normalized = normalize(file.path)
    if (isAppleDoubleJunk(normalized)) continue
    if (
      isInFolder(normalized, IMAGEFOLDER) ||
      isInFolder(normalized, PREVIEWFOLDER)
    ) {
      sketch.images.push({
        path: normalized,
        getData: () => file.buffer()
      })
    }
  }

  // 设计稿更新后重新解析时，先删除旧条目，保证淘汰顺序按最新进入时间
  sketchMemo.delete(key)
  evictMemoIfNeeded()
  sketchMemo.set(key, { stamp, value: sketch })
  return sketch
}
