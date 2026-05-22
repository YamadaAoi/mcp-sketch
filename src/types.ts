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
