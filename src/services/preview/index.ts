import { exec } from 'child_process'
import { existsSync } from 'fs'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { chromium, type BrowserContext, type Page } from 'playwright-core'
import { getEnv } from '@/utils/env'
import { checkPort } from '../checkPort'

export const sketchPreviewInputSchema = z.object({
  url: z.string().describe('Preview URL')
})

export type SketchPreviewInputSchema = SchemaOutput<
  typeof sketchPreviewInputSchema
>

export async function openBrowser(url: string) {
  const chromePath = getEnv('CHROME_PATH')
  const debugPort = getEnv('DEBUG_PORT')
  const userDataDir = getEnv('USER_DATA_DIR')

  if (!chromePath) {
    throw new Error('❌ Chrome browser path not configured')
  }

  if (!existsSync(chromePath)) {
    throw new Error(`❌ Chrome browser not found, check path: ${chromePath}`)
  }

  const isPortOpen = await checkPort(debugPort)
  if (!isPortOpen) {
    exec(
      `"${chromePath}" --remote-debugging-port=${debugPort} --user-data-dir="${userDataDir}"`
    )

    let waitTime = 0
    while (!(await checkPort(debugPort)) && waitTime < 10000) {
      await new Promise(r => setTimeout(r, 500))
      waitTime += 500
    }
    if (!(await checkPort(debugPort))) {
      throw new Error('❌ Browser launch timeout, check Chrome path and port')
    }
  }

  const browser = await chromium.connectOverCDP(`http://localhost:${debugPort}`)
  const context: BrowserContext = browser.contexts()[0]
  if (!context) throw new Error('Failed to get browser context')

  let targetRoot: string
  try {
    const targetUrl = new URL(url)
    targetRoot = targetUrl.origin + targetUrl.pathname
  } catch {
    targetRoot = url
  }

  const existingPage = context.pages().find(p => {
    try {
      const pageUrl = new URL(p.url())
      const pageRoot = pageUrl.origin + pageUrl.pathname
      return pageRoot === targetRoot
    } catch {
      return false
    }
  })

  let page: Page
  if (existingPage) {
    await existingPage.bringToFront()
    page = existingPage
  } else {
    page = await context.newPage()
    await page.goto(url, { waitUntil: 'networkidle' })
  }

  return page
}

/**
 * 预览 URL
 * @param args - 输入参数
 * @param args.url - 预览 URL
 * @returns 输出参数，包含预览 URL
 */
export async function sketchPreview(args: SketchPreviewInputSchema) {
  let response = 'Sketch Exception'

  try {
    await openBrowser(args.url)
    response = `✅ ${args.url} opened in browser`
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
