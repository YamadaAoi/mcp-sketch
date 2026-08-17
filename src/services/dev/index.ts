import { spawn } from 'child_process'
import { access } from 'fs/promises'
import { resolve } from 'path'
import http from 'http'
import https from 'https'
import { platform } from 'os'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { getEnv } from '@/utils/env'

export const sketchDevInputSchema = z.object({
  url: z.string().describe('Preview URL')
})

export type SketchDevInputSchema = SchemaOutput<typeof sketchDevInputSchema>

async function startBgService(command: string) {
  const projectPath = getEnv('CWD')
  const absolutePath = projectPath ? resolve(projectPath) : process.cwd()
  if (projectPath) {
    try {
      await access(absolutePath)
    } catch {
      throw new Error(`❌ ${projectPath} not found`)
    }
  }
  return new Promise<string | undefined>((resolve, reject) => {
    const p = platform()
    let commandStr = ''
    let args: string[] = []
    let tmuxSession: string | undefined

    if (p === 'win32') {
      commandStr = 'powershell'
      args = [
        `Start-Process powershell -WorkingDirectory '${absolutePath}' -ArgumentList '-Command ${command}'`
      ]
    } else {
      commandStr = 'tmux'
      tmuxSession = `server-${Date.now()}`
      args = [
        'new-session',
        '-d',
        '-c',
        absolutePath,
        '-s',
        tmuxSession,
        command
      ]
    }

    const child = spawn(commandStr, args)

    child.on('error', err => {
      reject(new Error(`❌ can not start service: ${err.message}`))
    })

    child.on('spawn', () => {
      resolve(tmuxSession)
    })

    child.unref()
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
function waitForServer(targetUrl: string, timeout = 60000, interval = 500) {
  const startTime = Date.now()
  return new Promise<{ success: boolean; statusCode?: number }>(resolve => {
    const check = () => {
      httpRequest(targetUrl)
        .then(res => {
          if (res.statusCode) {
            resolve({ success: true, statusCode: res.statusCode })
          } else {
            retry()
          }
        })
        .catch(() => {
          retry()
        })
    }

    const retry = () => {
      if (Date.now() - startTime > timeout) {
        resolve({ success: false })
      } else {
        setTimeout(check, interval)
      }
    }

    check()
  })
}

export function getSessionDesc(session: string) {
  return `✅ Use the following commands to manage the background dev server:\n- To view real-time logs: tmux attach -t ${session} (Press Ctrl+B, then D to safely detach and return to the terminal)\n- To stop the server: tmux kill-session -t ${session}`
}

/**
 * 预览 URL
 * @param args - 输入参数
 * @param args.url - 预览 URL
 * @returns 输出参数，包含预览 URL
 */
export async function sketchDev(args: SketchDevInputSchema) {
  let response = 'Sketch Exception'
  let session: string | undefined

  try {
    const command = getEnv('SERVER_COMMAND')
    const isAccessible = await checkUrlOnce(args.url)
    if (isAccessible) {
      response = `✅ dev server already running at ${args.url}, no need to start again`
    } else {
      session = await startBgService(command)
      const result = await waitForServer(args.url)
      if (!result.success) {
        throw new Error(
          `❌ server launch failed or timeout, check command: ${command}`
        )
      }
      response = `✅ dev server launch success !`
      if (session) {
        response = `${response}\n${getSessionDesc(session)}`
      }
    }
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
    if (session) {
      response = `${response}\n${getSessionDesc(session)}`
    }
  }

  return response
}
