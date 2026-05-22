import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  handleSketchHtmlPlan,
  sketchPlanInputSchema,
  type SketchPlanInputSchema
} from '@/services/sketchHtmlPlan'

const toolName = 'sketch_html_plan'

/**
 * 根据路径寻找并规划sketch导出的html文件压缩包，拆解为多个组件
 * 若不提供page信息，默认取第一个page。
 * 若不提供artboard信息，默认取第一个artboard。
 * 如果file_path不存在或者路径错误，或者指定页面不存在，或者指定画板不存在，则返回相应错误
 * page优先级：page_name > 第一个page
 * artboard优先级：artboard_name > 第一个artboard
 * @param {SketchAnalyzeInputSchema} args - sketch文件分析参数
 * @property {string} file_path - sketch html zip文件路径(必填)
 * @property {string} page_name - 指定页面名称(可选)
 * @property {string} artboard_name - 指定画板名称(可选)
 * @returns {CallToolResult} - 英文回复让ai读取此次请求生成的组件列表作为参考
 */
async function sketchHtmlPlan(
  args: SketchPlanInputSchema
): Promise<CallToolResult> {
  logger.debug(args, 'sketchHtmlPlan')
  const text = await handleSketchHtmlPlan(args)
  return {
    content: [
      {
        type: 'text',
        text
      }
    ]
  }
}

export function toolSketchHtmlPlan(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description: '规划Sketch Meaxure导出的画板，拆解为多个组件',
      inputSchema: sketchPlanInputSchema
    },
    sketchHtmlPlan
  ]
}
