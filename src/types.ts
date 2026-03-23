import type Sketch from '@sketch-hq/sketch-file-format-ts'
import { z } from 'zod/v4'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AnySchema } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'

/**
 * 解析skecth文件分析参数
 */
export const inputSchema = z.object({
  file_path: z.string().describe('sketch file path(required)'),
  page_id: z.string().describe('page id (optional)').optional(),
  page_name: z.string().describe('page name (optional)').optional(),
  artboard_id: z.string().describe('artboard id (optional)').optional(),
  artboard_name: z.string().describe('artboard name (optional)').optional(),
  node_id: z.string().describe('node id (optional)').optional(),
  node_name: z.string().describe('node name (optional)').optional(),
  assets_path: z
    .string()
    .describe('assets path (optional), default src/assets/sketch')
    .optional()
})

/**
 * 解析skecth文件分析参数类型
 * @property {string} file_path - sketch文件路径(必填)
 * @property {string} page_id - 指定页面ID(可选)
 * @property {string} page_name - 指定页面名称(可选)
 * @property {string} artboard_id - 指定画板ID(可选)
 * @property {string} artboard_name - 指定画板名称(可选)
 * @property {string} node_id - 指定节点ID(可选)
 * @property {string} node_name - 指定节点名称(可选)
 * @property {string} assets_path - 指定静态资源存放路径(可选)，默认src/assets/sketch
 */
export type InputSchema = SchemaOutput<typeof inputSchema>

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
  /**
   * 布尔操作符
   */
  booleanOperation?:
    | 'Union'
    | 'Intersection'
    | 'Difference'
    | 'Subtract'
    | 'None'
  layers: Structure[]
  frame?: { height: number; width: number; x: number; y: number }
  /**
   * 共享样式ID
   */
  sharedStyleID?: string
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
  /**
   * 图层ID，普通节点不存放，只存放symbolMaster.layers的ID，用于symbolInstance覆盖
   */
  id?: string
  /**
   * (symbolInstance/symbolMaster) 模板 ID
   */
  symbolID?: string
  /**
   * (symbolMaster) 可覆盖字段
   */
  overrideProperties?: string[]
  /**
   * (symbolInstance) 覆盖字段和值
   */
  overrideValues?: Array<{
    value: string
    overrideName: string
  }>
}

/**
 * 解析后的sketch文件内容
 */
export interface SketchPrompt {
  meta: {
    description: string
  }
  globalResources: {
    sharedStyles: Record<string, LayerStyle>
    symbolMasters: Record<string, Structure>
  }
  layers: Structure[]
}
