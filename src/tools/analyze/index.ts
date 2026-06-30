import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  sketchAnalyze,
  sketchAnalyzeInputSchema,
  type SketchAnalyzeInputSchema
} from '@/services/analyze'

const toolName = 'sketch_html_analyze'

/**
 * 根据路径寻找并分析sketch导出的html文件(zip或目录)，提取设计结构信息
 * 若不提供page信息，默认取第一个page。
 * 若不提供artboard信息，默认取第一个artboard。
 * 如果file_path不存在或者路径错误，或者指定页面不存在，或者指定画板不存在，则返回相应错误
 * page优先级：page_name > 第一个page
 * artboard优先级：artboard_name > 第一个artboard
 * @param {SketchAnalyzeInputSchema} args - sketch文件分析参数
 * @property {string} file_path - sketch html文件路径(zip或目录,必填)
 * @property {string} page_name - 指定页面名称(可选)
 * @property {string} artboard_name - 指定画板名称(可选)
 * @property {number[]} rect - 指定解析矩形区域(可选)，格式为[x, y, width, height](x, y为左上角坐标， width, height为矩形宽度和高度)
 * @property {string} assets_path - 资产文件路径(可选)
 * @returns {CallToolResult} - 设计结构JSON
 */
async function sketchHtmlAnalyze(
  args: SketchAnalyzeInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchHtmlAnalyze')
  const text = await sketchAnalyze(args)
  return {
    content: [
      {
        type: 'text',
        text
      }
    ]
  }
}

export function toolSketchAnalyze(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description:
        'Analyze sketch Meaxure files and return the design structure of corresponding pages or drawing boards',
      inputSchema: sketchAnalyzeInputSchema
    },
    sketchHtmlAnalyze
  ]
}
