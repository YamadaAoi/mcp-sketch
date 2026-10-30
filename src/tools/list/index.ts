import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  sketchList,
  sketchListInputSchema,
  type SketchListInputSchema
} from '@/services/list'

const toolName = 'sketch_list'

/**
 * 列出Sketch Meaxure导出的画板信息，返回列表JSON并写入 .sketch-cache/{design}/list.json
 * @param {SketchListInputSchema} args - sketch文件列出参数
 * @property {string} file_path - sketch html文件路径(zip或目录,必填)
 * @returns {CallToolResult} - 画板列表JSON（含预览图路径与图层数据量）
 */
async function sketchListTool(
  args: SketchListInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchListTool')
  try {
    const text = await sketchList(args)
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

export function toolSketchList(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description:
        'List the artboards from the Sketch Meaxure export archive (zip or folder)',
      inputSchema: sketchListInputSchema
    },
    sketchListTool
  ]
}
