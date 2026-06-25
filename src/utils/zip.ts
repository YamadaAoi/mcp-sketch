import fs from 'fs/promises'
import path from 'path'
import { Open } from 'unzipper'
import * as cheerio from 'cheerio'
import { parse } from '@babel/parser'
import { type Node } from '@babel/traverse'
import { generate } from '@babel/generator'
import { logger } from '@/utils/logger'
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
  data: Buffer
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
 * 规范路径
 * @param p - 路径
 * @returns 规范后的路径
 */
export function normalize(p: string) {
  return decodeURIComponent(p).replace(/\\/g, '/').replace(/\/+/g, '/')
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
      const relativePath = path.join(relativeBase, entry.name)

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

export async function openSketchHtmlFile(filePath: string) {
  let directory: UnifiedDirectory

  if (filePath.endsWith('.zip')) {
    directory = await Open.file(filePath)
  } else {
    directory = await readLocalDirectory(filePath)
  }

  const indexHtmlEntry = directory.files.find(f => f.path.endsWith(INDEXHTML))
  if (!indexHtmlEntry) {
    throw new Error(`${INDEXHTML} not found in ${filePath}`)
  }
  const indexHtml = (await indexHtmlEntry.buffer()).toString('utf8')
  const script = getScriptFromHtml(indexHtml)
  const sketchData = getDataFromScript(script)

  const data = JSON.parse(sketchData) as HtmlData

  const sketch: SketchHtmlFile = {
    data,
    images: []
  }

  for (const file of directory.files) {
    const filePath = normalize(file.path)
    if (
      filePath.includes(`${IMAGEFOLDER}/`) ||
      filePath.includes(`${PREVIEWFOLDER}/`)
    ) {
      const buffer = await file.buffer()
      sketch.images.push({
        path: filePath,
        data: buffer
      })
    }
  }

  return sketch
}
