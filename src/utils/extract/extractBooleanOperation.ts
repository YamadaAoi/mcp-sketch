import Sketch from '@sketch-hq/sketch-file-format-ts'

/**
 * 提取布尔操作符
 * @param booleanOperation - 布尔操作符
 * @returns - 布尔操作符字符串
 */
export function extractBooleanOperation(
  booleanOperation: Sketch.BooleanOperation
) {
  switch (booleanOperation) {
    case Sketch.BooleanOperation.Union:
      return 'Union'
    case Sketch.BooleanOperation.Intersection:
      return 'Intersection'
    case Sketch.BooleanOperation.Difference:
      return 'Difference'
    case Sketch.BooleanOperation.Subtract:
      return 'Subtract'
    default:
      return 'None'
  }
}
