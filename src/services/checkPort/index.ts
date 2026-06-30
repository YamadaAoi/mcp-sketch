import { Socket } from 'net'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'

export const sketchCheckPortInputSchema = z.object({
  port: z.number().describe('port number'),
  host: z.string().describe('host address').optional()
})

export type SketchCheckPortInputSchema = SchemaOutput<
  typeof sketchCheckPortInputSchema
>

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
 * 检查端口是否打开
 * @param args - 输入参数
 * @param args.port - 端口号
 * @param args.host - 主机地址
 * @returns 输出参数，包含端口是否打开
 */
export async function sketchCheckPort(args: SketchCheckPortInputSchema) {
  let response = 'Sketch Exception'

  try {
    const isOpen = await checkPort(args.port, args.host)
    response = `${args.host}:${args.port} is ${isOpen ? 'open' : 'closed'}`
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
