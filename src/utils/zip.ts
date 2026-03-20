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
   * document.json内的共享样式和组件
   */
  globalResources: {
    /**
     * 包括document内layerStyles、layerTextStyles、foreignLayerStyles里的localSharedStyle、foreignTextStyles里的localSharedStyle
     */
    sharedStyles: Map<string, Sketch.Style>
    /**
     * 包括pages里扫描出来的symbolMaster对象、document内foreignSymbols里的symbolMaster
     */
    symbolMasters: Map<string, Sketch.SymbolMaster>
  }
}

export const METAJSON = 'meta.json'
export const DOCUMENTJSON = 'document.json'
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
 * 处理document.json文件
 * 提取所有共享样式和组件
 * 包括document内layerStyles、layerTextStyles、foreignLayerStyles里的localSharedStyle、foreignTextStyles里的localSharedStyle
 * 包括document内foreignSymbols里的symbolMaster
 * @param documentJson - document.json文件内容
 * @param sketch - sketch文件
 */
function handleDocumentJson(documentJson: string, sketch: SketchFile) {
  const document = JSON.parse(documentJson) as Sketch.Document
  if (document?.layerStyles?.objects?.length) {
    document.layerStyles.objects.forEach(sharedStyle => {
      if (sharedStyle.value) {
        sketch.globalResources.sharedStyles.set(
          sharedStyle.do_objectID,
          sharedStyle.value
        )
      }
    })
  }

  if (document?.layerTextStyles?.objects?.length) {
    document.layerTextStyles.objects.forEach(sharedStyle => {
      if (sharedStyle.value) {
        sketch.globalResources.sharedStyles.set(
          sharedStyle.do_objectID,
          sharedStyle.value
        )
      }
    })
  }

  if (document?.foreignLayerStyles?.length) {
    document.foreignLayerStyles.forEach(foreignLayerStyle => {
      if (foreignLayerStyle.localSharedStyle?.value) {
        sketch.globalResources.sharedStyles.set(
          foreignLayerStyle.localSharedStyle.do_objectID,
          foreignLayerStyle.localSharedStyle.value
        )
      }
    })
  }

  if (document?.foreignTextStyles?.length) {
    document.foreignTextStyles.forEach(foreignTextStyle => {
      if (foreignTextStyle.localSharedStyle?.value) {
        sketch.globalResources.sharedStyles.set(
          foreignTextStyle.localSharedStyle.do_objectID,
          foreignTextStyle.localSharedStyle.value
        )
      }
    })
  }

  if (document.foreignSymbols?.length) {
    document.foreignSymbols.forEach(foreignSymbol => {
      if (foreignSymbol.symbolMaster) {
        sketch.globalResources.symbolMasters.set(
          foreignSymbol.symbolMaster.symbolID,
          foreignSymbol.symbolMaster
        )
      }
    })
  }
}

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

  const sketch: SketchFile = {
    metaJson,
    pagesJson: new Map<string, string>(),
    images: new Map<string, Buffer>(),
    globalResources: {
      sharedStyles: new Map<string, Sketch.Style>(),
      symbolMasters: new Map<string, Sketch.SymbolMaster>()
    }
  }
  const documentJsonEntry = directory.files.find(f => f.path === DOCUMENTJSON)
  const documentJson = documentJsonEntry
    ? (await documentJsonEntry.buffer()).toString('utf8')
    : ''

  if (documentJson) {
    handleDocumentJson(documentJson, sketch)
  }

  for (const file of directory.files) {
    if (file.path.startsWith(`${PAGEFOLDER}/`) && file.path.endsWith('.json')) {
      const pageJson = (await file.buffer()).toString('utf8')
      const symbolMastersInPage = filterSymbolMaster(pageJson)
      if (symbolMastersInPage.length) {
        symbolMastersInPage.forEach(symbolMaster => {
          sketch.globalResources.symbolMasters.set(
            symbolMaster.symbolID,
            symbolMaster
          )
        })
      }
      sketch.pagesJson.set(file.path, pageJson)
    } else if (file.path.startsWith(`${IMAGEFOLDER}/`)) {
      const buffer = await file.buffer()
      sketch.images.set(file.path, buffer)
    }
  }

  return sketch
}
