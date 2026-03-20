import type { Layer, Structure } from '@/types'
import { treeTransform } from '@/utils/treeTransform'
import {
  extractTextBehavior,
  extractTextOverrideStyle
} from '@/utils/extract/extractText'
import { extractBeatmap } from '@/utils/extract/extractBeatmap'
import { extractBooleanOperation } from '@/utils/extract/extractBooleanOperation'
import { extractStyle } from '@/utils/extract/extractStyle'

function getTChildren(node: Layer) {
  let layers: Layer[] | undefined
  if (
    (node._class === 'group' ||
      node._class === 'shapeGroup' ||
      node._class === 'symbolMaster') &&
    node.layers?.length
  ) {
    layers = node.layers
  }
  return layers
}

function getRChildren(node: Structure) {
  return node.layers
}

export function assembleNode(
  layers: Layer[],
  images: Map<string, Buffer>,
  assetsPath?: string,
  isSymbolMaster?: boolean
) {
  const sharedStyleIDs = new Set<string>()
  const symbolMasterIDs = new Set<string>()
  function transform(node: Layer): Structure | undefined {
    if (
      !node.isVisible ||
      node._class === 'slice' ||
      node._class === 'MSImmutableHotspotLayer' ||
      (!isSymbolMaster && node._class === 'symbolMaster')
    ) {
      return undefined
    }
    const newLayer: Structure = {
      type: node._class,
      name: node.name,
      isLocked: node.isLocked,
      booleanOperation: extractBooleanOperation(node.booleanOperation),
      layers: [],
      frame: node.frame
        ? {
            width: node.frame.width,
            height: node.frame.height,
            x: node.frame.x,
            y: node.frame.y
          }
        : undefined,
      style: node.style
        ? extractStyle(node.style, images, assetsPath)
        : undefined
    }
    if (isSymbolMaster) {
      newLayer.id = node.do_objectID
    }
    if (node.sharedStyleID) {
      newLayer.sharedStyleID = node.sharedStyleID
      sharedStyleIDs.add(node.sharedStyleID)
    }
    if (node._class === 'rectangle') {
      newLayer.fixedRadius = node.fixedRadius
    }
    if (node._class === 'text') {
      newLayer.textBehavior = extractTextBehavior(node.textBehaviour)
      newLayer.content = node.attributedString?.string
      if (node.attributedString?.attributes?.length) {
        newLayer.textOverridesStyle = extractTextOverrideStyle(
          node.attributedString.attributes
        )
      }
    }
    if (node._class === 'shapeGroup') {
      newLayer.hasClippingMask = node.hasClippingMask
    }
    if (node._class === 'symbolMaster' && node.symbolID) {
      newLayer.symbolID = node.symbolID
      newLayer.overrideProperties = node.overrideProperties
        ?.filter(item => item.canOverride)
        ?.map(item => item.overrideName)
    }
    if (node._class === 'symbolInstance' && node.symbolID) {
      newLayer.symbolID = node.symbolID
      symbolMasterIDs.add(node.symbolID)
      if (node.overrideValues?.length) {
        newLayer.overrideValues = node.overrideValues.map(item => ({
          value:
            typeof item.value === 'string'
              ? item.value
              : extractBeatmap(item.value, images, assetsPath),
          overrideName: item.overrideName
        }))
      }
    }
    if (node._class === 'bitmap') {
      newLayer.rotation = node.rotation
      newLayer.clippingMask = node.clippingMask
      newLayer.image = extractBeatmap(node.image, images, assetsPath)
    }
    return newLayer
  }

  const newLayers = treeTransform(layers, transform, getTChildren, getRChildren)

  return {
    sharedStyleIDs: Array.from(sharedStyleIDs),
    symbolMasterIDs: Array.from(symbolMasterIDs),
    layers: newLayers
  }
}
