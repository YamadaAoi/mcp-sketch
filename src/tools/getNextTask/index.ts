import { z } from 'zod/v4'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import type { RegisterToolParams } from '../../types'
import { logger } from '../../utils/logger'

const toolName = 'sketch_get_next_task'
const inputSchema = z.object({
  session_id: z.string().describe('会话id'),
  cursor_id: z.string().describe('起始节点 ID')
})

function getNextTask(args: SchemaOutput<typeof inputSchema>): CallToolResult {
  logger.debug(args, 'getNextTask')
  return {
    content: []
  }
}

/**
 * 功能：获取下一批节点数据，包含智能状态提示。
 * 输入:
 * - session_id: 会话唯一标识符
 * - cursor_id: 起始节点 ID
 * 返回:
 * - batch_id: 批次 ID
 * - nodes: 详细节点列表（含 Style, Text, suggestedLayout, imageRef (无二进制数据)）
 * - assets_manifest: 本批次涉及的图片 ID 列表（不含二进制数据）
 * -- output_dir_relative: 资源目录相对路径 (e.g., ./src/assets/sketch_imports/uuid-123/)
 * -- files: 数组，仅包含本批次用到的图片，[{ ref_id, filename, relative_path, dimensions, used_in_nodes }]
 * - status_hint (关键)
 * -- is_revisit: boolean (请求的范围是否包含已完成的节点)
 * -- suggestion: 例：注意：Node X-Y 之前已完成..." 或 "新进度，包含 3 张图片已导出。
 * - next_suggested_cursor: 推荐的下一个节点 ID
 * @returns
 */
export function toolGetNextTask(): RegisterToolParams {
  return [
    toolName,
    {
      title: toolName,
      description:
        '询问服务器下一步应该绘制哪个区域。服务器会根据依赖关系返回最优先的可处理节点。',
      inputSchema
    },
    getNextTask
  ]
}
