import { z } from 'zod/v4'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AnySchema } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'

/**
 * 解析sketch html zip文件分析参数
 */
export const sketchHtmlInputSchema = z.object({
  file_path: z.string().describe('sketch html zip file path(required)'),
  page_id: z.string().describe('page id (optional)').optional(),
  page_name: z.string().describe('page name (optional)').optional(),
  artboard_id: z.string().describe('artboard id (optional)').optional(),
  artboard_name: z.string().describe('artboard name (optional)').optional(),
  rect: z
    .array(z.number())
    .describe('rect [x, y, width, height] (optional)')
    .optional(),
  assets_path: z
    .string()
    .describe('assets path (optional), default src/assets/sketch')
    .optional(),
  save_result: z
    .boolean()
    .describe('save analysis result (optional), default true')
    .optional()
})

/**
 * 解析sketch html zip文件分析参数类型
 * @property {string} file_path - sketch html zip文件文件路径(必填)
 * @property {string} page_id - 指定页面ID(可选)
 * @property {string} page_name - 指定页面名称(可选)
 * @property {string} artboard_id - 指定画板ID(可选)
 * @property {string} artboard_name - 指定画板名称(可选)
 * @property {number[]} rect - 指定解析矩形区域(可选)，格式为[x, y, width, height](x, y为左上角坐标， width, height为矩形宽度和高度)
 * @property {string} assets_path - 指定静态资源存放路径(可选)，默认src/assets/sketch
 * @property {boolean} save_result - 是否保存分析结果JSON文件(可选)，默认true
 */
export type SketchHtmlInputSchema = SchemaOutput<typeof sketchHtmlInputSchema>

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
