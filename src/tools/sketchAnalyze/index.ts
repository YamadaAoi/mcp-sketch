import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { RegisterToolParams } from '@/types'
import { logger } from '@/utils/logger'
import {
  inputSchema,
  type InputSchema
} from '@/services/sketchAnalyze/resolveArtboardTarget'
import { handleSketchAnalyze } from '@/services/sketchAnalyze'

const toolName = 'sketch_analyze'

/**
 * 根据路径寻找并分析sketch文件，存储相应设计结构到json文件
 * 若不提供page信息，默认取第一个page。
 * 若不提供artboard信息，默认取第一个artboard。
 * 若不提供node信息，默认取artboard内所有节点。
 * 如果file_path不存在或者路径错误，或者指定页面不存在，或者指定画板不存在，或者指定节点不存在，则返回相应错误
 * page优先级：page_id > page_name > 第一个page
 * artboard优先级：artboard_id > artboard_name > 第一个artboard
 * node优先级：node_id > node_name > artboard内所有节点
 * @param {InputSchema} args - sketch文件分析参数
 * @property {string} file_path - sketch文件路径(必填)
 * @property {string} page_id - 指定页面ID(可选)
 * @property {string} page_name - 指定页面名称(可选)
 * @property {string} artboard_id - 指定画板ID(可选)
 * @property {string} artboard_name - 指定画板名称(可选)
 * @property {string} node_id - 指定节点ID(可选)
 * @property {string} node_name - 指定节点名称(可选)
 * @returns {CallToolResult} - 英文回复让ai读取此次请求生成的设计结构json文件作为参考
 */
async function sketchAnalyze(args: InputSchema): Promise<CallToolResult> {
  logger.debug(args, 'sketchAnalyze')
  const targetPath = await handleSketchAnalyze(args)
  return {
    content: [
      {
        type: 'text',
        text: `Please read the design structure json file as reference: ${targetPath}`
      }
    ]
  }
}

export function toolSketchAnalyze(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description: '分析提供的sketch文件，返回相应设计结构',
      inputSchema
    },
    sketchAnalyze
  ]
}
