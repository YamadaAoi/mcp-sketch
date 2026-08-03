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
 * 结果会缓存到 .sketch-cache/artboards/{design}/{page}/{artboard}/layer.json（无约束时）
 * 或 .sketch-cache/artboards/{design}/{page}/{artboard}/{hash}/layer.json（有约束时，hash 为约束条件的 MD5 前 8 位）
 * 设计稿未更新时命中缓存直接读取
 * @param {SketchAnalyzeInputSchema} args - sketch文件分析参数
 * @property {string} file_path - sketch html文件路径(zip或目录,必填)
 * @property {string} page_name - 指定页面名称(必填)
 * @property {string} artboard_name - 指定画板名称(必填)
 * @property {number[]} rect - 指定解析矩形区域(可选)，格式为[x, y, width, height]
 * @property {number[][]} exclude_rects - 指定排除矩形区域(可选)，格式为[[x, y, width, height], ...]
 * @property {string} assets_path - 资产文件路径(可选)
 * @property {number} limit - 返回前 N 个排序后的图层(可选)
 * @property {number} offset - 从排序后的图层起始索引(可选，默认 0)
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
