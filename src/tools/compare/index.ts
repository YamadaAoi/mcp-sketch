import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  sketchCompare,
  sketchCompareInputSchema,
  type SketchCompareInputSchema
} from '@/services/compare'

const toolName = 'sketch_compare'

/**
 * 对比浏览器截图与画板预览图，返回相似度分数与差异图路径
 * @param {SketchCompareInputSchema} args - 对比参数
 * @property {string} file_path - sketch html文件路径(zip或目录,必填)
 * @property {string} page_name - 指定页面名称(必填)
 * @property {string} artboard_name - 指定画板名称(必填)
 * @property {string} screenshot_path - 浏览器截图文件路径(必填)
 * @returns {CallToolResult} - 相似度分数与差异图路径
 */
async function sketchCompareTool(
  args: SketchCompareInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchCompareTool')
  try {
    const text = await sketchCompare(args)
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

export function toolSketchCompare(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description:
        'Compare a browser screenshot with the artboard preview image, return similarity score and diff image',
      inputSchema: sketchCompareInputSchema
    },
    sketchCompareTool
  ]
}
