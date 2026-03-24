import { Open } from 'unzipper'
import * as cheerio from 'cheerio'
import { parse } from '@babel/parser'
import { type Node } from '@babel/traverse'
import { generate } from '@babel/generator'
import { logger } from '@/utils/logger'
import { getSafeTraverse } from './getTraverse'

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
  css?: string[]
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

export interface HtmlSketchLayer {
  type: string
  name: string
  rect: {
    x?: number
    y?: number
    w?: number
    h?: number
  }
  styleName?: string
  css?: string[]
  assets?: Array<{
    name: string
    format: string
    path: string
  }>
}

export interface HtmlSketchArtboard {
  pageName: string
  pageObjectID: string
  name: string
  objectID: string
  width: number
  height: number
  layers: HtmlSketchLayer[]
  imagePath?: string
}

export interface SketchHtmlFile {
  data: HtmlData
  /**
   * images文件内容
   */
  images: Array<{
    path: string
    data: Buffer
  }>
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

export async function openSketchHtmlFile(filePath: string) {
  const directory = await Open.file(filePath)

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
    if (
      file.path.includes(`${IMAGEFOLDER}/`) ||
      file.path.includes(`${PREVIEWFOLDER}/`)
    ) {
      const buffer = await file.buffer()
      sketch.images.push({
        path: file.path,
        data: buffer
      })
    }
  }

  return sketch
}
