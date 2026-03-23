/**
 * 复制@sketch-hq/sketch-file-format-ts内类型
 */
enum PatternFillType {
  Tile = 0,
  Fill = 1,
  Stretch = 2,
  Fit = 3
}

/**
 * 提取背景填充模式
 * @param patternFillType - sketch背景填充模式
 * @returns 背景填充模式描述
 */
export function extractPatternFillType(patternFillType: PatternFillType) {
  switch (patternFillType) {
    case PatternFillType.Tile:
      return 'Tile'
    case PatternFillType.Fill:
      return 'Fill'
    case PatternFillType.Stretch:
      return 'Stretch'
    case PatternFillType.Fit:
      return 'Fit'
    default:
      return 'unknown'
  }
}
