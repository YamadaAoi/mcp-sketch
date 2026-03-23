import type Sketch from '@sketch-hq/sketch-file-format-ts'
import type { LayerOverrideTextStyle, LayerTextStyle } from '@/types'
import { extractColor } from './extractColor'

/**
 * 复制@sketch-hq/sketch-file-format-ts内类型
 */
enum TextHorizontalAlignment {
  Left = 0,
  Right = 1,
  Centered = 2,
  Justified = 3,
  Natural = 4
}

/**
 * 复制@sketch-hq/sketch-file-format-ts内类型
 */
enum TextVerticalAlignment {
  Top = 0,
  Middle = 1,
  Bottom = 2
}

/**
 * 复制@sketch-hq/sketch-file-format-ts内类型
 */
enum TextBehaviour {
  Flexible = 0,
  Fixed = 1,
  FixedWidthAndHeight = 2
}

/**
 * 提取文本对齐属性
 * @param alignment - 文本对齐属性
 * @returns 提取后的文本对齐属性
 */
export function extractFontAlignment(alignment?: TextHorizontalAlignment) {
  switch (alignment) {
    case TextHorizontalAlignment.Right:
      return 'right'
    case TextHorizontalAlignment.Centered:
      return 'center'
    case TextHorizontalAlignment.Justified:
      return 'justify'
    case TextHorizontalAlignment.Natural:
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
export function extractVerticalAlignment(verticalAlig?: TextVerticalAlignment) {
  switch (verticalAlig) {
    case TextVerticalAlignment.Middle:
      return 'middle'
    case TextVerticalAlignment.Bottom:
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
export function extractTextBehavior(behaviour: TextBehaviour) {
  switch (behaviour) {
    case TextBehaviour.Fixed:
      return 'Fixed'
    case TextBehaviour.FixedWidthAndHeight:
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
  textStyleVerticalAlignmentKey?: TextVerticalAlignment
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
