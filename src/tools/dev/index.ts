import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  sketchDev,
  sketchDevInputSchema,
  type SketchDevInputSchema
} from '@/services/dev'

const toolName = 'sketch_html_dev'

async function sketchDevTool(
  args: SketchDevInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchDevTool')
  const text = await sketchDev(args)
  return {
    content: [
      {
        type: 'text',
        text
      }
    ]
  }
}

export function toolSketchDev(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description: 'Start dev server for previewing',
      inputSchema: sketchDevInputSchema
    },
    sketchDevTool
  ]
}
