import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { openSketchHtmlFile } from '@/utils/zip'
import { previewImage } from '../sketchHtmlPlan'

export const sketchListInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)')
})

export type SketchListInputSchema = SchemaOutput<typeof sketchListInputSchema>

export async function handleSketchHtmlList(args: SketchListInputSchema) {
  let response = 'Sketch Exception'

  try {
    const list: Array<{
      pageName: string
      artboardName: string
      previewPath: string
    }> = []
    const sketchData = await openSketchHtmlFile(args.file_path)
    if (sketchData?.data?.artboards?.length) {
      for (const artboard of sketchData.data.artboards) {
        const previewPath = await previewImage(
          args.file_path,
          artboard,
          sketchData.images
        )
        list.push({
          pageName: artboard.pageName,
          artboardName: artboard.name,
          previewPath
        })
      }
    }
    response = JSON.stringify(list)
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
