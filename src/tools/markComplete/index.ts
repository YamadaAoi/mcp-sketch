import { z } from 'zod/v4'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { RegisterToolParams } from '../../types'
import { logger } from '../../utils/logger'

const toolName = 'sketch_mark_complete'
const inputSchema = z.object({
  session_id: z.string().describe('会话id'),
  page_id: z.string().describe('页面id'),
  node_id: z.string().describe('节点id')
})

function markComplete(args: SchemaOutput<typeof inputSchema>): CallToolResult {
  logger.debug(args, 'markComplete')
  return {
    content: []
  }
}

/**
 * 功能：确认批次处理完毕，更新持久化状态
 * 输入:
 * - session_id: 会话唯一标识符
 * - batch_id: 批次 ID
 * - processed_node_range: { start, end }
 * 返回:
 * - acknowledged: true
 * - updated_progress: 百分比
 * @returns
 */
export function toolMarkComplete(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description: '告诉服务器某个节点已生成代码，可以解锁其子节点了。',
      inputSchema
    },
    markComplete
  ]
}
