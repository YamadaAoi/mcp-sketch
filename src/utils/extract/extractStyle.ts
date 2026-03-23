import type Sketch from '@sketch-hq/sketch-file-format-ts'
import type { LayerFill, LayerStyle } from '@/types'
import { extractColor } from './extractColor'
import { extractPatternFillType } from './extractPattern'
import { extractBorderPosition } from './extractBorder'
import { extractTextStyle } from './extractText'
import { extractFill } from './extractFill'

/**
 * 复制@sketch-hq/sketch-file-format-ts内类型
 */
enum FillType {
  Color = 0,
  Gradient = 1,
  Pattern = 4
}

/**
 * 组装 Sketch 样式为 LayerStyle 类型
 * @param style - Sketch 样式
 * @param args - 输入参数
 * @param sketchFile - Sketch 文件
 * @returns 组装后的 LayerStyle 类型
 */
export function extractStyle(
  style: Sketch.Style,
  images: Map<string, Buffer>,
  assetsPath?: string
) {
  const layerStyle: LayerStyle = {}

  if (style.contextSettings?.opacity !== undefined) {
    layerStyle.opacity = style.contextSettings.opacity
  }

  if (style.fills?.length) {
    const enabledFills = style.fills.filter(fill => fill.isEnabled)
    layerStyle.fills = enabledFills.map(fill => {
      const fillStyle: LayerFill = {
        fill: extractFill(fill, images, assetsPath)
      }
      if ((fill.fillType as FillType) === FillType.Pattern) {
        fillStyle.patternFillType = extractPatternFillType(fill.patternFillType)
        fillStyle.patternTileScale = fill.patternTileScale
      }
      return fillStyle
    })
  }

  if (style.borders?.length) {
    const enabledBorders = style.borders.filter(border => border.isEnabled)
    if (enabledBorders.length > 0) {
      layerStyle.borders = enabledBorders.map(border => ({
        fill: extractFill(border, images, assetsPath),
        thickness: border.thickness,
        position: extractBorderPosition(border.position)
      }))
    }
  }

  if (style.shadows?.length) {
    const enabledShadows = style.shadows.filter(shadow => shadow.isEnabled)
    if (enabledShadows.length > 0) {
      layerStyle.shadows = enabledShadows.map(shadow => ({
        color: extractColor(shadow.color),
        blurRadius: shadow.blurRadius,
        offsetX: shadow.offsetX,
        offsetY: shadow.offsetY
      }))
    }
  }

  if (style.textStyle) {
    const attr = style.textStyle.encodedAttributes
    layerStyle.textBaseStyle = extractTextStyle(attr)
  }

  return layerStyle
}
