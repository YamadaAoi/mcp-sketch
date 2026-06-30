import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  sketchScreenshot,
  sketchScreenshotInputSchema,
  type SketchScreenshotInputSchema
} from '@/services/screenshot'

const toolName = 'sketch_html_screenshot'

async function sketchScreenshotTool(
  args: SketchScreenshotInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchScreenshotTool')
  const text = await sketchScreenshot(args)
  return {
    content: [
      {
        type: 'text',
        text
      }
    ]
  }
}

export function toolSketchScreenshot(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description: 'Take a screenshot of a URL and save it',
      inputSchema: sketchScreenshotInputSchema
    },
    sketchScreenshotTool
  ]
}
