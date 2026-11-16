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
 * 纯两图差异器：基准图（设计侧）与实现截图（页面侧）逐像素比对，返回相似度分数与差异图路径
 * @param {SketchCompareInputSchema} args - 对比参数
 * @property {string} base_image - 基准图路径(必填)：整页比对用 list 返回的画板 previewPath，组件比对用 analyze -r 返回的区域 previewPath(已按 rect 裁剪)
 * @property {string} screenshot_path - 实现截图路径(必填)：整页截图或元素截图(如 Playwright)
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
        'Diff two images pixel-wise: a design base image (artboard or region preview) vs an implementation screenshot (full-page or element shot), return similarity score and diff image',
      inputSchema: sketchCompareInputSchema
    },
    sketchCompareTool
  ]
}
