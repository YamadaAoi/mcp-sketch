import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  sketchList,
  sketchListInputSchema,
  type SketchListInputSchema
} from '@/services/list'

const toolName = 'sketch_html_list'

/**
 * 列出Sketch Meaxure导出的画板
 * 若不提供page信息，默认取第一个page。
 * 若不提供artboard信息，默认取第一个artboard。
 * 如果file_path不存在或者路径错误，或者指定页面不存在，或者指定画板不存在，则返回相应错误
 * page优先级：page_name > 第一个page
 * artboard优先级：artboard_name > 第一个artboard
 * @param {SketchListInputSchema} args - sketch文件列出参数
 * @property {string} file_path - sketch html文件路径(zip或目录,必填)
 * @returns {CallToolResult} - 英文回复让ai读取此次请求生成的画板列表作为参考
 */
async function sketchHtmlList(
  args: SketchListInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchHtmlList')
  const text = await sketchList(args)
  return {
    content: [
      {
        type: 'text',
        text
      }
    ]
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
    sketchHtmlList
  ]
}
