import type Sketch from '@sketch-hq/sketch-file-format-ts'
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AnySchema } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'

export interface RegisterToolConfig {
  title?: string
  description?: string
  inputSchema?: AnySchema | undefined
  outputSchema?: AnySchema
  annotations?: ToolAnnotations
  _meta?: Record<string, unknown>
}

export type RegisterToolCB = ToolCallback<AnySchema | undefined>

export type RegisterToolParams = [string, RegisterToolConfig, RegisterToolCB]

/**
 * Artboard里的图层类型
 */
export type Layer =
  | Sketch.Artboard
  | Sketch.Group
  | Sketch.Oval
  | Sketch.Polygon
  | Sketch.Rectangle
  | Sketch.ShapePath
  | Sketch.Star
  | Sketch.Triangle
  | Sketch.ShapeGroup
  | Sketch.Text
  | Sketch.Slice
  | Sketch.Hotspot
  | Sketch.Bitmap
  | Sketch.SymbolMaster
  | Sketch.SymbolInstance

/**
 * 图层填充样式
 */
export interface LayerFill {
  /**
   * 填充颜色/渐变色/背景图片路径
   */
  fill: string
  /**
   * 背景填充模式
   */
  patternFillType?: 'Tile' | 'Fill' | 'Stretch' | 'Fit' | 'unknown'
  /**
   * 背景填充缩放比例
   */
  patternTileScale?: number
}

/**
 * 图层边框样式
 */
export interface LayerBorder {
  /**
   * 边框填充颜色/渐变色
   */
  fill: string
  /**
   * 边框宽度
   */
  thickness: number
  /**
   * 边框位置
   */
  position?: 'Inside' | 'Outside' | 'Center' | 'unknown'
}

/**
 * 图层阴影样式
 */
export interface LayerShadow {
  color: string
  blurRadius: number
  offsetX: number
  offsetY: number
}

/**
 * (Text) 文本基础样式
 */
export interface LayerTextStyle {
  fontFamily?: string
  fontSize?: number
  color?: string
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'right' | 'center' | 'justify' | 'natural' | 'left'
  verticalAlign?: 'top' | 'middle' | 'bottom'
}

/**
 * (Text) 文本覆盖样式
 */
export interface LayerOverrideTextStyle extends LayerTextStyle {
  location: number
  length: number
}

/**
 * 提取后的样式
 */
export interface LayerStyle {
  opacity?: number
  fills?: LayerFill[]
  borders?: LayerBorder[]
  shadows?: LayerShadow[]
  textBaseStyle?: LayerTextStyle
}

/**
 * 解析后的图层结构
 */
export interface Structure {
  type: Layer['_class']
  name: string
  isLocked: boolean
  layers: Structure[]
  frame?: { height: number; width: number; x: number; y: number }
  style?: LayerStyle
  /**
   * (Rectangle) 圆角半径
   */
  fixedRadius?: number
  /**
   * (Oval/Polygon/Star/Triangle/ShapePath) 具体的矢量坐标点
   * 数据量大，暂不考虑，仅定义类型
   */
  points?: number[]
  /**
   * (Text) 文本行为
   */
  textBehavior?: 'Fixed' | 'FixedWidthAndHeight' | 'Flexible'
  /**
   * (Text) 文本内容
   */
  content?: string
  /**
   * (Text) 文本覆盖样式
   */
  textOverridesStyle?: LayerOverrideTextStyle[]
  /**
   * (ShapeGroup) 是否有裁剪遮罩
   */
  hasClippingMask?: boolean
  /**
   * (bitmap) 旋转角度
   */
  rotation?: number
  /**
   * (bitmap) 裁剪遮罩路径
   */
  clippingMask?: string
  /**
   * (bitmap) 图片路径
   */
  image?: string
}
