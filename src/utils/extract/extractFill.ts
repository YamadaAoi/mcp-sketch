import Sketch from '@sketch-hq/sketch-file-format-ts'
import { extractColor } from './extractColor'
import { extractGradient } from './extractGradient'
import { extractBeatmap } from './extractBeatmap'

/**
 * 提取填充颜色/渐变色/背景图片路径
 * @param fill - sketch填充样式
 * @param args - 输入参数
 * @param sketchFile - Sketch 文件
 * @returns 填充颜色/渐变色/背景图片路径
 */
export function extractFill(
  fill: Pick<Sketch.Fill, 'fillType' | 'color' | 'gradient' | 'image'>,
  images: Map<string, Buffer>,
  assetsPath?: string
) {
  if (fill.fillType === Sketch.FillType.Color) {
    return extractColor(fill.color)
  } else if (fill.fillType === Sketch.FillType.Gradient) {
    return extractGradient(fill.gradient)
  } else if (fill.fillType === Sketch.FillType.Pattern && fill.image) {
    return extractBeatmap(fill.image, images, assetsPath)
  } else {
    return 'unkown'
  }
}
