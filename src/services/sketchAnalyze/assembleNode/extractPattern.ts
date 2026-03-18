import Sketch from '@sketch-hq/sketch-file-format-ts'

/**
 * 提取背景图片路径
 * TODO: 处理背景图片路径
 * @param image - sketch背景图片
 * @returns 背景图片路径
 */
export function extractPattern(image: Sketch.FileRef | Sketch.DataRef) {
  return image._ref
}

/**
 * 提取背景填充模式
 * @param patternFillType - sketch背景填充模式
 * @returns 背景填充模式描述
 */
export function extractPatternFillType(
  patternFillType: Sketch.PatternFillType
) {
  switch (patternFillType) {
    case Sketch.PatternFillType.Tile:
      return 'Tile'
    case Sketch.PatternFillType.Fill:
      return 'Fill'
    case Sketch.PatternFillType.Stretch:
      return 'Stretch'
    case Sketch.PatternFillType.Fit:
      return 'Fit'
    default:
      return 'unknown'
  }
}
