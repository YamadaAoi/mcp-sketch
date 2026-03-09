import { z } from 'zod/v4'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { RegisterToolParams } from '../../types'
import { logger } from '../../utils/logger'

const toolName = 'sketch_init_session'
const inputSchema = z.object({
  file_path: z.string().describe('sketch文件路径'),
  artboard_id: z.string().describe('指定页面 ID(可选)').optional(),
  artboard_name: z
    .string()
    .describe('指定页面名称（模糊匹配）(可选)')
    .optional(),
  force_restart: z
    .boolean()
    .describe('是否强制忽略旧状态重新开始（默认 false）')
    .default(false)
})

function initSession(args: SchemaOutput<typeof inputSchema>): CallToolResult {
  logger.debug(args, 'initSession')
  return {
    content: []
  }
}

/**
 * 功能：加载/恢复会话，执行预计算（布局推断、元数据统计）。
 * 输入:
 * - file_path: Sketch 文件路径
 * - artboard_id (可选): 指定页面 ID(可选)
 * - artboard_name: 指定页面名称（模糊匹配）(可选)
 * - force_restart: 是否强制忽略旧状态重新开始（默认 false）
 * 返回:
 * - session_id: 会话唯一标识符
 * - status: "new" | "resumed" | "needs_selection"
 * - available_artboards: (仅当 needs_selection 时) 列出所有页面供 AI 选择
 * - root_tree_summary: 精简树结构（含 suggestedLayout, descendant_count）
 * - progress_report:
 * -- total_nodes: 总数
 * -- completed_count: 已完成的节点数（若有旧状态）
 * -- last_cursor_id: 上次停止的节点 ID（若有旧状态）
 * - message: 给ai的提示 例如："检测到未完成任务，上次停在 node_500。可从该处继续，或指定其他节点重做。"
 * @returns
 */
export function toolInitSession(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description: '初始化/恢复一个会话，分析 Sketch 结构并准备任务队列。',
      inputSchema
    },
    initSession
  ]
}
