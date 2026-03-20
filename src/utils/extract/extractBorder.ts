import Sketch from '@sketch-hq/sketch-file-format-ts'

/**
 * 提取边框位置
 * @param borderPosition - sketch边框位置
 * @returns 边框位置描述
 */
export function extractBorderPosition(borderPosition: Sketch.BorderPosition) {
  switch (borderPosition) {
    case Sketch.BorderPosition.Inside:
      return 'Inside'
    case Sketch.BorderPosition.Outside:
      return 'Outside'
    case Sketch.BorderPosition.Center:
      return 'Center'
    default:
      return 'unknown'
  }
}
