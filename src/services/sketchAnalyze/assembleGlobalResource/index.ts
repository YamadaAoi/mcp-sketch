import type Sketch from '@sketch-hq/sketch-file-format-ts'
import type { SketchFile } from '@/utils/zip'
import type { LayerStyle, Structure } from '@/types'
import { extractStyle } from '@/utils/extract/extractStyle'
import { assembleNode } from '../assembleNode'
import { logger } from '@/utils/logger'

/**
 * 处理全局资源中的样式
 * @param sharedStyleIDs - 全局资源中的样式ID列表
 * @param sharedStyles - 全局资源中的样式映射
 * @param images - 全局资源中的图片映射
 * @param assetsPath - 资产路径
 * @returns 处理后的样式映射
 */
function handleStyle(
  sharedStyleIDs: string[],
  sharedStyles: Map<string, Sketch.Style>,
  images: Map<string, Buffer>,
  assetsPath?: string
) {
  const styles: Map<string, LayerStyle> = new Map()
  sharedStyleIDs.forEach(id => {
    const style = sharedStyles.get(id)
    if (style) {
      styles.set(id, extractStyle(style, images, assetsPath))
    }
  })
  return Object.fromEntries(styles)
}

/**
 * 处理全局资源中的symbolMaster，返回symbolMaster和symbolSharedStyleIDs
 * @param symbolMasterIDs - 全局资源中的symbolMasterID列表
 * @param symbolMasters - 全局资源中的symbolMaster映射
 * @param images - 全局资源中的图片映射
 * @param assetsPath - 资产路径
 * @returns 处理后的symbolMaster映射
 */
function handleSymbolMaster(
  symbolMasterIDs: string[],
  symbolMasters: Map<string, Sketch.SymbolMaster>,
  images: Map<string, Buffer>,
  assetsPath?: string
) {
  const masters: Map<string, Structure> = new Map()
  const stack = [...symbolMasterIDs]
  const symbolSharedStyleIDs: string[] = []

  while (stack.length > 0) {
    const current = stack.pop()!

    if (masters.has(current)) {
      continue
    }

    const symbolMaster = symbolMasters.get(current)
    if (symbolMaster) {
      const result = assembleNode([symbolMaster], images, assetsPath, true)
      stack.push(...result.symbolMasterIDs)
      symbolSharedStyleIDs.push(...result.sharedStyleIDs)
      masters.set(current, result.layers[0])
    } else {
      logger.error(`symbolMaster ${current} 不存在`)
    }
  }

  return {
    masters: Object.fromEntries(masters),
    symbolSharedStyleIDs
  }
}

/**
 * 处理全局资源中的symbolMaster和sharedStyle
 * @param ids - 页面中的sharedStyleIDs和symbolMasterID列表
 * @param sketchFile - Sketch文件内容
 * @param assetsPath - 资产路径
 * @returns 处理后的symbolMaster和sharedStyle
 */
export function assembleGlobalResource(
  ids: {
    sharedStyleIDs: string[]
    symbolMasterIDs: string[]
  },
  sketchFile: SketchFile,
  assetsPath?: string
) {
  const result = handleSymbolMaster(
    ids.symbolMasterIDs,
    sketchFile.globalResources.symbolMasters,
    sketchFile.images,
    assetsPath
  )
  const sharedStyles = handleStyle(
    Array.from(
      new Set([...ids.sharedStyleIDs, ...result.symbolSharedStyleIDs])
    ),
    sketchFile.globalResources.sharedStyles,
    sketchFile.images,
    assetsPath
  )

  return {
    sharedStyles,
    symbolMasters: result.masters
  }
}
