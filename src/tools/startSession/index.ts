import { z } from 'zod/v4'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { RegisterToolParams } from '../../types'
import { logger } from '../../utils/logger'

const inputSchema = z.object({
  file_path: z.string().describe('sketch文件路径')
})

function startSession(args: SchemaOutput<typeof inputSchema>): CallToolResult {
  logger.debug(args, 'startSession')
  return {
    content: []
  }
}

export function toolStartSession(): RegisterToolParams {
  return [
    'sketch_start_session',
    {
      inputSchema
    },
    startSession
  ]
}
