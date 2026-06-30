import path from 'path'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { openBrowser } from '../preview'
import { processImage } from '@/utils/saveFile'

export const sketchScreenshotInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)'),
  page_name: z.string().describe('page name (optional)'),
  artboard_name: z.string().describe('artboard name (optional)'),
  url: z.string().describe('Screenshot URL')
})

export type SketchScreenshotInputSchema = SchemaOutput<
  typeof sketchScreenshotInputSchema
>

/**
 * 截图
 * @param args - 输入参数
 * @param args.file_path - sketch html export path (zip or folder, required)
 * @param args.page_name - page name (optional)
 * @param args.artboard_name - artboard name (optional)
 * @param args.url - Screenshot URL
 * @returns 输出参数，包含截图路径
 */
export async function sketchScreenshot(args: SketchScreenshotInputSchema) {
  let response = 'Sketch Exception'

  try {
    const page = await openBrowser(args.url)
    await page.bringToFront()
    const screenshot = await page.screenshot()

    const parsed = path.parse(args.file_path)
    const dest = path.join(
      parsed.dir,
      `${parsed.name}.cache`,
      `chrome_${args.page_name}_${args.artboard_name}_${Date.now()}.png`
    )

    const previewPath = await processImage(screenshot, dest)
    response = `Screenshot saved to ${previewPath}`
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
