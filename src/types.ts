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
  | Sketch.Group
  | Sketch.Oval
  | Sketch.Polygon
  | Sketch.Rectangle
  | Sketch.ShapePath
  | Sketch.Star
  | Sketch.Triangle
  | Sketch.ShapeGroup
  | Sketch.Text
  | Sketch.SymbolInstance
  | Sketch.Slice
  | Sketch.Hotspot
  | Sketch.Bitmap

/**
 * 解析后的图层结构
 */
export interface Structure {
  type: Layer['_class']
  id: string
  name: string
  layers: Structure[]
}
