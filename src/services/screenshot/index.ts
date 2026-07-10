import path from 'path'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { getSessionDesc, openBrowser, startServer } from '../preview'
import { getEnv } from '@/utils/env'
import { processImage } from '@/utils/saveFile'

export const sketchScreenshotInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)'),
  page_name: z.string().describe('page name'),
  artboard_name: z.string().describe('artboard name'),
  url: z.string().describe('Preview URL')
})

export type SketchScreenshotInputSchema = SchemaOutput<
  typeof sketchScreenshotInputSchema
>

/**
 * 截图
 * @param args - 输入参数
 * @param args.file_path - sketch html export path (zip or folder, required)
 * @param args.page_name - page name
 * @param args.artboard_name - artboard name
 * @param args.url - Screenshot URL
 * @returns 输出参数，包含截图路径
 */
export async function sketchScreenshot(args: SketchScreenshotInputSchema) {
  let response = 'Sketch Exception'
  let session: string | undefined

  try {
    const command = getEnv('SERVER_COMMAND')
    const cwd = getEnv('CWD')
    session = await startServer(args.url, command, cwd)
    const page = await openBrowser(args.url, command)
    const screenshot = await page.screenshot()
    await page?.context()?.browser()?.close()

    const parsed = path.parse(args.file_path)
    const dest = path.join(
      parsed.dir,
      `${parsed.name}.cache`,
      `chrome_${args.page_name}_${args.artboard_name}_${Date.now()}.png`
    )

    const previewPath = await processImage(screenshot, dest)
    response = `Screenshot saved to ${previewPath}`
    if (session) {
      response = `${response}\n${getSessionDesc(session)}`
    }
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
    if (session) {
      response = `${response}\n${getSessionDesc(session)}`
    }
  }

  return response
}
