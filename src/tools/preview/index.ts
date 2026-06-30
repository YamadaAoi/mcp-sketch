import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  sketchPreview,
  sketchPreviewInputSchema,
  type SketchPreviewInputSchema
} from '@/services/preview'

const toolName = 'sketch_html_preview'

async function sketchPreviewTool(
  args: SketchPreviewInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchPreviewTool')
  const text = await sketchPreview(args)
  return {
    content: [
      {
        type: 'text',
        text
      }
    ]
  }
}

export function toolSketchPreview(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description: 'Preview a URL in the browser',
      inputSchema: sketchPreviewInputSchema
    },
    sketchPreviewTool
  ]
}
