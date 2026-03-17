// import type Sketch from '@sketch-hq/sketch-file-format-ts'
import type { Layer, Structure } from '@/types'
import { treeTransform } from '@/utils/treeTransform'

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

function transform(node: Layer): Structure {
  return {
    type: node._class,
    id: node.do_objectID,
    name: node.name,
    layers: []
  }
}

export function assembleNode(layers: Layer[]) {
  return treeTransform(layers, transform, getTChildren, getRChildren)
}
