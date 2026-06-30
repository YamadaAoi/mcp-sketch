import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { openSketchHtmlFile } from '@/utils/zip'

export const sketchListInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)')
})

export type SketchListInputSchema = SchemaOutput<typeof sketchListInputSchema>

/**
 * 获取sketch html文件中的所有artboard列表
 * @param args 输入参数
 * @param args.file_path sketch html文件路径
 * @returns 输出参数，包含所有artboard的列表
 */
export async function sketchList(args: SketchListInputSchema) {
  let response = 'Sketch Exception'

  try {
    const sketchData = await openSketchHtmlFile(args.file_path)
    const list =
      sketchData?.data?.artboards?.map(a => {
        return {
          pageName: a.pageName,
          artboardName: a.name
        }
      }) ?? []
    response = JSON.stringify(list)
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
