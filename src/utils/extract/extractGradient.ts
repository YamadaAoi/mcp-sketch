import Sketch from '@sketch-hq/sketch-file-format-ts'
import { extractColor } from './extractColor'

/**
 * 解析 Sketch 的 PointString "{x, y}" 为数字对象
 */
function parsePoint(pointStr: string): { x: number; y: number } {
  const match = pointStr.match(/\{([\d.\-eE+]+),\s*([\d.\-eE+]+)\}/)
  if (!match) {
    console.warn(`Invalid point string: ${pointStr}, defaulting to {0,0}`)
    return { x: 0, y: 0 }
  }
  return {
    x: parseFloat(match[1]),
    y: parseFloat(match[2])
  }
}

/**
 * 计算从 from 到 to 的 CSS 角度
 *
 * 1. Sketch 坐标系: X右, Y下. (0,0)是左上.
 * 2. CSS linear-gradient 角度: 0deg 指向正上方 (Top), 90deg 指向正右方 (Right). 顺时针旋转.
 * 3. 向量 V = (to.x - from.x, to.y - from.y).
 * 4. Math.atan2(dy, dx) 返回的是标准数学坐标 (X右, Y上) 的角度.
 *    在屏幕坐标系 (Y下) 中:
 *    - 向右 (1, 0): atan2(0, 1) = 0 rad.
 *    - 向下 (0, 1): atan2(1, 0) = PI/2 rad (90 deg).
 *    - 向上 (0, -1): atan2(-1, 0) = -PI/2 rad (-90 deg).
 * 5. 映射到 CSS:
 *    - 屏幕向右 (0 rad) -> CSS 90deg. (偏移 +90)
 *    - 屏幕向下 (90 deg) -> CSS 180deg. (90 + 90 = 180). 正确.
 *    - 屏幕向上 (-90 deg) -> CSS 0deg. (-90 + 90 = 0). 正确.
 *
 * 公式: cssDeg = (rad * 180 / PI) + 90
 */
function calculateAngle(
  from: { x: number; y: number },
  to: { x: number; y: number }
): number {
  const dx = to.x - from.x
  const dy = to.y - from.y

  const rad = Math.atan2(dy, dx)
  let deg = (rad * 180) / Math.PI + 90

  // 规范化到 0-360
  if (deg < 0) deg += 360
  if (deg >= 360) deg -= 360

  return deg
}

/**
 * 提取 Sketch 渐变为 CSS 渐变字符串
 * @param gradient - Sketch 渐变对象
 * @returns 对应的 CSS 渐变字符串
 */
export function extractGradient(gradient: Sketch.Gradient) {
  const fromPoint = parsePoint(gradient.from)
  const toPoint = parsePoint(gradient.to)

  // 1. 处理色标 (Stops)
  // 确保按位置排序，防止 Sketch 数据乱序导致渲染错误
  const sortedStops = [...gradient.stops].sort(
    (a, b) => a.position - b.position
  )

  const stopsCss = sortedStops
    .map(stop => {
      const colorStr = extractColor(stop.color)
      const posPercent = (stop.position * 100).toFixed(2) + '%'
      return `${colorStr} ${posPercent}`
    })
    .join(', ')

  // 2. 根据类型生成 CSS
  switch (gradient.gradientType) {
    case Sketch.GradientType.Linear: {
      const angle = calculateAngle(fromPoint, toPoint)
      const angleStr = Number.isInteger(angle)
        ? `${angle}`
        : `${angle.toFixed(2)}`
      return `linear-gradient(${angleStr}deg, ${stopsCss})`
    }

    case Sketch.GradientType.Radial: {
      const dx = toPoint.x - fromPoint.x
      const dy = toPoint.y - fromPoint.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 如果距离极小或为 0 (例如 from==to)，使用 farthest-corner 覆盖整个容器
      // 否则使用计算出的百分比半径
      let radiusStr: string
      if (distance < 0.0001) {
        radiusStr = 'farthest-corner'
      } else {
        radiusStr = `${(distance * 100).toFixed(2)}%`
      }

      const centerX = (fromPoint.x * 100).toFixed(2)
      const centerY = (fromPoint.y * 100).toFixed(2)

      return `radial-gradient(${radiusStr} at ${centerX}% ${centerY}%, ${stopsCss})`
    }

    case Sketch.GradientType.Angular: {
      const angle = calculateAngle(fromPoint, toPoint)
      const centerX = (fromPoint.x * 100).toFixed(2)
      const centerY = (fromPoint.y * 100).toFixed(2)

      return `conic-gradient(from ${angle.toFixed(2)}deg at ${centerX}% ${centerY}%, ${stopsCss})`
    }

    default:
      return 'unknown'
  }
}
