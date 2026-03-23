/**
 * 复制@sketch-hq/sketch-file-format-ts内类型
 */
enum BooleanOperation {
  None = -1,
  Union = 0,
  Subtract = 1,
  Intersection = 2,
  Difference = 3
}

/**
 * 提取布尔操作符
 * @param booleanOperation - 布尔操作符
 * @returns - 布尔操作符字符串
 */
export function extractBooleanOperation(booleanOperation: BooleanOperation) {
  switch (booleanOperation) {
    case BooleanOperation.Union:
      return 'Union'
    case BooleanOperation.Intersection:
      return 'Intersection'
    case BooleanOperation.Difference:
      return 'Difference'
    case BooleanOperation.Subtract:
      return 'Subtract'
    default:
      return 'None'
  }
}
