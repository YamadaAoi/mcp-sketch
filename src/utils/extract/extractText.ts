import Sketch from '@sketch-hq/sketch-file-format-ts'
import type { LayerOverrideTextStyle, LayerTextStyle } from '@/types'
import { extractColor } from './extractColor'

/**
 * 提取文本对齐属性
 * @param alignment - 文本对齐属性
 * @returns 提取后的文本对齐属性
 */
export function extractFontAlignment(
  alignment?: Sketch.TextHorizontalAlignment
) {
  switch (alignment) {
    case Sketch.TextHorizontalAlignment.Right:
      return 'right'
    case Sketch.TextHorizontalAlignment.Centered:
      return 'center'
    case Sketch.TextHorizontalAlignment.Justified:
      return 'justify'
    case Sketch.TextHorizontalAlignment.Natural:
      return 'natural'
    default:
      return 'left'
  }
}

/**
 * 提取垂直对齐属性
 * @param verticalAlig - 垂直对齐属性
 * @returns 提取后的垂直对齐属性
 */
export function extractVerticalAlignment(
  verticalAlig?: Sketch.TextVerticalAlignment
) {
  switch (verticalAlig) {
    case Sketch.TextVerticalAlignment.Middle:
      return 'middle'
    case Sketch.TextVerticalAlignment.Bottom:
      return 'bottom'
    default:
      return 'top'
  }
}

/**
 * 提取文本行为属性
 * @param textBehavior - 文本行为属性
 * @returns 提取后的文本行为属性
 */
export function extractTextBehavior(behaviour: Sketch.TextBehaviour) {
  switch (behaviour) {
    case Sketch.TextBehaviour.Fixed:
      return 'Fixed'
    case Sketch.TextBehaviour.FixedWidthAndHeight:
      return 'FixedWidthAndHeight'
    default:
      return 'Flexible'
  }
}

/**
 * 提取文本样式属性
 * @param attr - 文本样式属性
 * @returns 提取后的文本样式属性
 */
export function extractTextStyle(attr: {
  paragraphStyle?: Sketch.ParagraphStyle
  MSAttributedStringFontAttribute?: Sketch.FontDescriptor
  MSAttributedStringColorAttribute?: Sketch.Color
  kerning?: number
  textStyleVerticalAlignmentKey?: Sketch.TextVerticalAlignment
}): LayerTextStyle {
  return {
    fontFamily: attr?.MSAttributedStringFontAttribute?.attributes.name,
    fontSize: attr?.MSAttributedStringFontAttribute?.attributes.size,
    color: attr?.MSAttributedStringColorAttribute
      ? extractColor(attr?.MSAttributedStringColorAttribute)
      : undefined,
    lineHeight: attr?.paragraphStyle?.maximumLineHeight,
    letterSpacing: attr?.kerning,
    textAlign: extractFontAlignment(attr?.paragraphStyle?.alignment),
    verticalAlign: extractVerticalAlignment(attr?.textStyleVerticalAlignmentKey)
  }
}

/**
 * 提取文本覆盖样式属性
 * @param attrs - 文本覆盖样式属性
 * @returns 提取后的文本覆盖样式属性
 */
export function extractTextOverrideStyle(
  attrs: Sketch.StringAttribute[]
): LayerOverrideTextStyle[] {
  return attrs.map(attr => {
    return {
      ...extractTextStyle(attr.attributes),
      location: attr.location,
      length: attr.length
    }
  })
}
