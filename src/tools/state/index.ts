import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  sketchState,
  sketchStateInputSchema,
  type SketchStateInputSchema
} from '@/services/state'

const toolName = 'sketch_html_state'

async function sketchStateTool(
  args: SketchStateInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchStateTool')
  const text = await sketchState(args)
  return {
    content: [
      {
        type: 'text',
        text
      }
    ]
  }
}

export function toolSketchState(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description: 'record sketch workflow state',
      inputSchema: sketchStateInputSchema
    },
    sketchStateTool
  ]
}
