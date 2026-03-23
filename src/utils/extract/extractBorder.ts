/**
 * 复制@sketch-hq/sketch-file-format-ts内类型
 */
enum BorderPosition {
  Center = 0,
  Inside = 1,
  Outside = 2
}

/**
 * 提取边框位置
 * @param borderPosition - sketch边框位置
 * @returns 边框位置描述
 */
export function extractBorderPosition(borderPosition: BorderPosition) {
  switch (borderPosition) {
    case BorderPosition.Inside:
      return 'Inside'
    case BorderPosition.Outside:
      return 'Outside'
    case BorderPosition.Center:
      return 'Center'
    default:
      return 'unknown'
  }
}
