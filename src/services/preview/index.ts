import { spawn } from 'child_process'
// import { existsSync } from 'fs'
import { resolve } from 'path'
import http from 'http'
import https from 'https'
import { Socket } from 'net'
import { platform } from 'os'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
// import { chromium, type BrowserContext, type Page } from 'playwright-core'
// import { getEnv } from '@/utils/env'

export const sketchPreviewInputSchema = z.object({
  url: z.string().describe('Preview URL'),
  command: z.string().describe('command to start local server').optional(),
  projectPath: z.string().describe('Project path').optional()
})

export type SketchPreviewInputSchema = SchemaOutput<
  typeof sketchPreviewInputSchema
>

function startInNewWindow(command: string, cwd: string) {
  let commandStr = ''
  let args: string[] = []
  const p = platform()

  if (p === 'win32') {
    commandStr = 'powershell'
    args = [
      '-NoProfile',
      '-Command',
      `Start-Process cmd -ArgumentList '/k ${command}' -WorkingDirectory '${cwd}'`
    ]
    // fullCommand = `Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location ${safeCwd}; ${command}"`
  } else if (p === 'darwin') {
    // macOS: 使用系统自带的 Terminal.app 打开新窗口
    // 使用 osascript 执行 AppleScript 是最稳妥的方式
    // fullCommand = `osascript -e 'tell application "Terminal" to do script "cd ${safeCwd} && ${command}"'`
  } else {
    // Linux: 尝试使用常见的终端模拟器 (gnome-terminal)
    // 如果系统没有 gnome-terminal，可以替换为 xterm -e
    // fullCommand = `gnome-terminal -- bash -c "cd ${safeCwd} && ${command}; exec bash" > /dev/null 2>&1 &`
  }

  const child = spawn(commandStr, args, {
    detached: true,
    stdio: 'ignore',
    cwd: cwd,
    windowsHide: false
  })

  // 销毁外壳进程的管道，确保 opencode 立即放行
  // child.stdin?.destroy()
  // child.stdout?.destroy()
  // child.stderr?.destroy()
  child.unref()

  console.log(`✅ 已在新窗口启动: ${command}`)
}

/**
 * 检查页面是否为可回收的空白页面
 * @param page - 页面实例
 * @returns 是否为可回收的空白页面
 */
// function isRecyclableBlankPage(page: Page): boolean {
//   const url = page.url()

//   if (url === 'about:blank') return true

//   try {
//     const parsed = new URL(url)
//     if (parsed.protocol === 'chrome:') {
//       // 匹配 newtab, new-tab-page, new_tab 等所有变体
//       const isNewTab = /new[-_]?tab/i.test(parsed.host)
//       if (isNewTab) return true
//     }
//   } catch {
//     return false
//   }

//   return false
// }

/**
 * 检查端口是否打开
 * @param port - 端口号
 * @param host - 主机地址
 * @returns 是否打开
 */
export function checkPort(
  port: number,
  host: string = 'localhost'
): Promise<boolean> {
  return new Promise(resolve => {
    const socket = new Socket()
    socket.setTimeout(1000)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', (err: { code: string }) => {
      socket.destroy()
      resolve(err.code !== 'ECONNREFUSED')
    })
    socket.connect(port, host)
  })
}

/**
 * 发送HTTP请求
 * @param targetUrl - 请求URL
 * @returns 响应对象
 */
function httpRequest(targetUrl: string) {
  return new Promise<{ statusCode?: number }>((resolve, reject) => {
    const parsedUrl = new URL(targetUrl)
    const isHttps = parsedUrl.protocol === 'https:'
    const client = isHttps ? https : http

    const req = client.get(
      targetUrl,
      {
        rejectUnauthorized: false
      },
      res => {
        resolve(res)
      }
    )

    req.on('error', err => {
      reject(err)
    })

    req.setTimeout(2000, () => {
      req.destroy()
      reject(new Error('Request Timeout'))
    })
  })
}

/**
 * 检查URL是否可访问
 * @param targetUrl - URL
 * @returns 是否可访问
 */
async function checkUrlOnce(targetUrl: string) {
  try {
    const res = await httpRequest(targetUrl)
    return !!res.statusCode
  } catch {
    return false
  }
}

/**
 * 等待服务器启动
 * @param url - URL
 * @param timeout - 超时时间
 * @param interval - 检查间隔
 * @returns 是否成功启动服务器
 */
// function waitForServer(targetUrl: string, timeout = 60000, interval = 500) {
//   const startTime = Date.now()
//   return new Promise<{ success: boolean; statusCode?: number }>(resolve => {
//     const check = () => {
//       httpRequest(targetUrl)
//         .then(res => {
//           if (res.statusCode) {
//             resolve({ success: true, statusCode: res.statusCode })
//           } else {
//             retry()
//           }
//         })
//         .catch(() => {
//           retry()
//         })
//     }

//     const retry = () => {
//       if (Date.now() - startTime > timeout) {
//         resolve({ success: false })
//       } else {
//         setTimeout(check, interval)
//       }
//     }

//     check()
//   })
// }

/**
 * 启动开发服务器
 * @param command - 启动命令
 * @param url - 预览URL，用于检测服务是否就绪
 * @param projectPath - 项目路径
 */
// async function startDevServer(
//   command: string,
//   url: string,
//   projectPath?: string
// ) {
//   const absolutePath = projectPath ? resolve(projectPath) : process.cwd()
//   if (projectPath && !existsSync(absolutePath)) {
//     throw new Error(`❌ ${projectPath} not found`)
//   }

//   const p = platform()

//   if (p === 'darwin') {
//     const script = `tell application "Terminal" to do script "cd \\"${absolutePath}\\" && ${command}"`
//     const child = spawn('osascript', ['-e', script], {
//       detached: true,
//       stdio: 'ignore'
//     })
//     child.unref()
//   } else if (p === 'linux') {
//     const script = `cd "${absolutePath}" && ${command}; exec bash`
//     const child = spawn('x-terminal-emulator', ['-e', 'bash', '-c', script], {
//       detached: true,
//       stdio: 'ignore'
//     })
//     child.unref()
//   } else if (p === 'win32') {
//     const child = spawn(command, {
//       detached: true,
//       stdio: 'ignore',
//       shell: true,
//       cwd: absolutePath,
//       windowsHide: false
//     })
//     child.unref()
//   } else {
//     throw new Error(`❌ Unsupported platform: ${p}`)
//   }

//   const result = await waitForServer(url)
//   if (!result.success) {
//     throw new Error(
//       `❌ server launch failed or timeout, check command: ${command}`
//     )
//   }
// }

/**
 * 启动或连接 Chrome 浏览器
 * @returns CDP 连接上下文
 */
// async function connectChrome() {
//   const chromePath = getEnv('CHROME_PATH') || ''
//   const debugPort = getEnv('DEBUG_PORT')
//   const userDataDir = getEnv('USER_DATA_DIR')

//   if (!chromePath) {
//     throw new Error('❌ Chrome browser path not configured')
//   }

//   const absoluteChromePath = resolve(chromePath)
//   if (!existsSync(absoluteChromePath)) {
//     throw new Error(`❌ Chrome browser not found, check path: ${chromePath}`)
//   }

//   const isPortOpen = await checkPort(debugPort)
//   if (!isPortOpen) {
//     const child = spawn(
//       chromePath,
//       [
//         '--start-maximized',
//         `--remote-debugging-port=${debugPort}`,
//         `--user-data-dir=${userDataDir}`
//       ],
//       {
//         detached: true,
//         stdio: 'ignore',
//         windowsHide: true
//       }
//     )
//     child.unref()

//     let waitTime = 0
//     while (!(await checkPort(debugPort)) && waitTime < 10000) {
//       await new Promise(r => setTimeout(r, 500))
//       waitTime += 500
//     }
//     if (!(await checkPort(debugPort))) {
//       throw new Error('❌ Browser launch timeout, check Chrome path and port')
//     }
//   }

//   const browser = await chromium.connectOverCDP(`http://localhost:${debugPort}`)
//   const context: BrowserContext = browser.contexts()[0]
//   if (!context) throw new Error('Failed to get browser context')

//   return context
// }

/**
 * 在浏览器中查找或创建页面并导航到目标URL
 * @param context - 浏览器上下文
 * @param url - 目标URL
 * @returns 页面实例
 */
// async function findOrCreatePage(context: BrowserContext, url: string) {
//   let targetRoot: string
//   try {
//     const targetUrl = new URL(url)
//     targetRoot = targetUrl.origin + targetUrl.pathname
//   } catch {
//     targetRoot = url
//   }

//   const pages = context.pages()

//   const existingPage = pages.find(p => {
//     try {
//       const pageUrl = new URL(p.url())
//       return pageUrl.origin + pageUrl.pathname === targetRoot
//     } catch {
//       return false
//     }
//   })

//   if (existingPage) {
//     await existingPage.bringToFront()
//     return existingPage
//   }

//   const blankPage = pages.find(p => isRecyclableBlankPage(p))

//   let page: Page
//   if (blankPage) {
//     page = blankPage
//     await page.bringToFront()
//   } else {
//     page = await context.newPage()
//   }

//   await page.goto(url, { waitUntil: 'domcontentloaded' })
//   return page
// }

/**
 * 打开浏览器并访问指定URL
 * @param url - 浏览器要打开的URL
 * @param command - 启动浏览器的命令
 * @param projectPath - 项目路径
 * @returns 浏览器实例
 */
export async function openBrowser(
  url: string,
  command?: string,
  projectPath?: string
) {
  const isAccessible = await checkUrlOnce(url)
  if (!isAccessible) {
    if (!command) {
      throw new Error(
        '❌ local server not started, please provide the start command'
      )
    }
    const absolutePath = projectPath ? resolve(projectPath) : process.cwd()
    startInNewWindow(command, absolutePath)
    // await startDevServer(command, url, projectPath)
  }

  // const context = await connectChrome()

  // return findOrCreatePage(context, url)
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
    await openBrowser(args.url, args.command, args.projectPath)
    response = `✅ ${args.url} opened in browser`
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
