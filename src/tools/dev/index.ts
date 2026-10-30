import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import { sketchDev } from '@/services/dev'

const toolName = 'sketch_dev'

async function sketchDevTool(): Promise<CallToolResult> {
  logger.debug('sketchDevTool')
  try {
    const text = await sketchDev()
    return {
      content: [
        {
          type: 'text',
          text
        }
      ]
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
        }
      ]
    }
  }
}

export function toolSketchDev(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description: 'Start dev server for previewing'
    },
    sketchDevTool
  ]
}
