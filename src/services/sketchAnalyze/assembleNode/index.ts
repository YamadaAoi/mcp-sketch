import type { Layer, Structure } from '@/types'
import type { NodeInfo } from '../resolveArtboardTarget'
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
    (node._class === 'group' || node._class === 'shapeGroup') &&
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
  nodeInfo: NodeInfo,
  images: Map<string, Buffer>,
  assetsPath?: string
) {
  function transform(node: Layer): Structure | undefined {
    if (
      !node.isVisible ||
      node._class === 'slice' ||
      node._class === 'MSImmutableHotspotLayer' ||
      node._class === 'symbolMaster'
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
      sharedStyleID: node.sharedStyleID,
      style: node.style
        ? extractStyle(node.style, images, assetsPath)
        : undefined
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
    if (node._class === 'symbolInstance') {
      // TODO: 处理 symbolInstance
    }
    if (node._class === 'bitmap') {
      newLayer.rotation = node.rotation
      newLayer.clippingMask = node.clippingMask
      newLayer.image = extractBeatmap(node.image, images, assetsPath)
    }
    return newLayer
  }

  return treeTransform(nodeInfo.layers, transform, getTChildren, getRChildren)
}
