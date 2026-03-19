import type { Layer, Structure } from '@/types'
import { treeTransform } from '@/utils/treeTransform'
import { assembleStyle } from './assembleStyle'
import { extractTextBehavior, extractTextOverrideStyle } from './extractText'
import { extractBeatmap } from './extractBeatmap'
import type { InputSchema, NodeInfo } from '../resolveArtboardTarget'
import type { SketchFile } from '@/utils/zip'

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
  args: InputSchema,
  sketchFile: SketchFile
) {
  function transform(node: Layer): Structure | undefined {
    if (
      !node.isVisible ||
      node._class === 'slice' ||
      node._class === 'MSImmutableHotspotLayer'
    ) {
      return undefined
    }
    const newLayer: Structure = {
      type: node._class,
      name: node.name,
      isLocked: node.isLocked,
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
        ? assembleStyle(node.style, args, sketchFile)
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
      newLayer.image = extractBeatmap(node.image, args, sketchFile)
    }
    return newLayer
  }

  return treeTransform(nodeInfo.layers, transform, getTChildren, getRChildren)
}
