import type Sketch from '@sketch-hq/sketch-file-format-ts'

/**
 * 提取颜色
 * @param color - sketch颜色
 * @returns rgba颜色字符串
 */
export function extractColor(color: Sketch.Color) {
  const r = Math.round(color.red * 255)
  const g = Math.round(color.green * 255)
  const b = Math.round(color.blue * 255)
  const a = color.alpha
  if (a === 1) {
    return `rgb(${r},${g},${b})`
  }
  return `rgba(${r},${g},${b},${a})`
}
