import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  handleSketchHtmlLocate,
  sketchLocateInputSchema,
  type SketchLocateInputSchema
} from '@/services/sketchHtmlLocate'

const toolName = 'sketch_html_locate'

async function sketchHtmlLocate(
  args: SketchLocateInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchHtmlLocate')
  const text = await handleSketchHtmlLocate(args)
  return {
    content: [
      {
        type: 'text',
        text
      }
    ]
  }
}

export function toolSketchHtmlLocate(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description:
        'Returns the layers with high layout score rank from the Sketch Meaxure export archive (zip or folder)',
      inputSchema: sketchLocateInputSchema
    },
    sketchHtmlLocate
  ]
}
