import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { getSketchData } from '@/utils/zip'

export const sketchListInputSchema = z.object({
  file_path: z.string().describe('sketch html zip file path(required)')
})

export type SketchListInputSchema = SchemaOutput<typeof sketchListInputSchema>

export async function handleSketchHtmlList(args: SketchListInputSchema) {
  let response = 'Sketch Exception'

  try {
    const sketchData = await getSketchData(args.file_path)
    response = JSON.stringify(
      sketchData.data.artboards.map(item => {
        return {
          pageName: item.pageName,
          artboardName: item.name
        }
      })
    )
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
