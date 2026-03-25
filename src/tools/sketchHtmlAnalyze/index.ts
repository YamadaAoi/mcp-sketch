import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import { sketchHtmlInputSchema, type SketchHtmlInputSchema } from '@/types'
import { handleSketchHtmlAnalyze } from '@/services/sketchHtmlAnalyze'

const toolName = 'sketch_html_analyze'

/**
 * 根据路径寻找并分析sketch导出的html文件压缩包，存储相应设计结构到json文件
 * 若不提供page信息，默认取第一个page。
 * 若不提供artboard信息，默认取第一个artboard。
 * 如果file_path不存在或者路径错误，或者指定页面不存在，或者指定画板不存在，则返回相应错误
 * page优先级：page_id > page_name > 第一个page
 * artboard优先级：artboard_id > artboard_name > 第一个artboard
 * @param {SketchHtmlInputSchema} args - sketch文件分析参数
 * @property {string} file_path - sketch html zip文件路径(必填)
 * @property {string} page_id - 指定页面ID(可选)
 * @property {string} page_name - 指定页面名称(可选)
 * @property {string} artboard_id - 指定画板ID(可选)
 * @property {string} artboard_name - 指定画板名称(可选)
 * @property {number[]} rect - 指定解析矩形区域(可选)，格式为[x, y, width, height](x, y为左上角坐标， width, height为矩形宽度和高度)
 * @property {string} assets_path - 资产文件路径(可选)
 * @property {boolean} saveResult - 是否保存分析结果JSON文件(可选)，默认true
 * @returns {CallToolResult} - 英文回复让ai读取此次请求生成的设计结构json文件作为参考
 */
async function sketchHtmlAnalyze(
  args: SketchHtmlInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchHtmlAnalyze')
  const text = await handleSketchHtmlAnalyze(args)
  return {
    content: [
      {
        type: 'text',
        text
      }
    ]
  }
}

export function toolSketchHtmlAnalyze(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description:
        'Analyze sketch html files and return the design structure of corresponding pages or drawing boards',
      inputSchema: sketchHtmlInputSchema
    },
    sketchHtmlAnalyze
  ]
}
