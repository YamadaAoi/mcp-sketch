import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { filterArtboards } from '../sketchHtmlAnalyze/filterArtboards'
import { openSketchHtmlFile } from '@/utils/zip'
import { isNumber } from '@/utils/util'

export const sketchLocateInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)'),
  page_name: z.string().describe('page name (optional)').optional(),
  artboard_name: z.string().describe('artboard name (optional)').optional(),
  limit: z
    .number()
    .describe('number of layers to return (optional, default 10)')
    .optional(),
  offset: z
    .number()
    .describe('starting index in sorted layers (optional, default 0)')
    .optional()
})

export type SketchLocateInputSchema = SchemaOutput<
  typeof sketchLocateInputSchema
>

function calculateLayoutScore(lyr: { rect: Array<number | undefined> }) {
  const width = lyr.rect[2]!
  const height = lyr.rect[3]!
  const area = width * height
  const longestSide = Math.max(width, height)
  const aspectRatio = longestSide / Math.min(width, height)

  let score = area

  // 长宽比极端加分
  if (aspectRatio >= 30) {
    score += longestSide * 14
  }

  return score
}

/**
 * 从 Sketch HTML 导出文件的指定页面和画板中提取布局分数排名靠前的图层
 * 布局分数计算规则：
 * 1. 面积（area）：图层宽度乘以高度
 * 2. 最长边（longest side）：图层宽度和高度中较长的边
 * 3. 长宽比（aspect ratio）：图层宽度除以高度
 * 4. 长宽比极端加分：如果长宽比大于等于 30，则额外加分
 * 5. 最终布局分数 = 面积 + 最长边 * 14
 * @param args - 输入参数
 * @param args.file_path - Sketch HTML 导出文件路径
 * @param args.page_name - 页面名称 (可选)
 * @param args.artboard_name - 画板名称 (可选)
 * @param args.offset - 起始偏移量 (可选，默认 0)
 * @param args.limit - 返回数量 (可选，默认 10)
 * @returns 图层信息 JSON 字符串
 */
export async function handleSketchHtmlLocate(args: SketchLocateInputSchema) {
  let response = 'Sketch Exception'

  try {
    const sketchHtmlData = await openSketchHtmlFile(args.file_path)
    const targetArtboard = filterArtboards(args, sketchHtmlData.data.artboards)
    const layers = (targetArtboard?.layers ?? [])
      .filter(
        lyr =>
          isNumber(lyr?.rect?.width) &&
          isNumber(lyr?.rect?.height) &&
          ((lyr.type === 'slice' && !!lyr.exportable?.length) ||
            (lyr.type === 'shape' &&
              lyr.css?.some(
                s => s.includes('background') || s.includes('border')
              )))
      )
      .map(lyr => {
        return {
          type: lyr.type,
          name: lyr.name,
          rect: [lyr.rect?.x, lyr.rect?.y, lyr.rect?.width, lyr.rect?.height]
        }
      })
    layers.sort((a, b) => {
      const scoreA = calculateLayoutScore(a)
      const scoreB = calculateLayoutScore(b)
      return scoreB - scoreA
    })
    const offset = args.offset ?? 0
    const limit = args.limit ?? 10
    response = JSON.stringify(layers.slice(offset, offset + limit))
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
