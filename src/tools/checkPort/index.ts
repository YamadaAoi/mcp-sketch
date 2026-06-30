import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  sketchCheckPort,
  sketchCheckPortInputSchema,
  type SketchCheckPortInputSchema
} from '@/services/checkPort'

const toolName = 'sketch_html_check_port'

async function sketchCheckPortTool(
  args: SketchCheckPortInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchCheckPortTool')
  const text = await sketchCheckPort(args)
  return {
    content: [
      {
        type: 'text',
        text
      }
    ]
  }
}

export function toolSketchCheckPort(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description: 'Check if a port is open on a host',
      inputSchema: sketchCheckPortInputSchema
    },
    sketchCheckPortTool
  ]
}
