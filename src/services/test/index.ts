import { spawn } from 'child_process'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'

export const sketchTestInputSchema = z.object({
  command: z.string().describe('test command')
})

export type SketchTestInputSchema = SchemaOutput<typeof sketchTestInputSchema>

function startInNewWindow(command: string) {
  const workingDirectory = process.cwd()
  console.log(command, workingDirectory)
  return new Promise<void>((resolve, reject) => {
    const child = spawn('powershell', [
      `Start-Process powershell -WorkingDirectory '${workingDirectory}' -ArgumentList '-Command ${command}'`
    ])

    child.on('error', err => {
      reject(new Error(`❌ 无法启动新窗口: ${err.message}`))
    })

    child.on('spawn', () => {
      resolve()
    })

    child.unref()
  })
}

export async function sketchTest(args: SketchTestInputSchema) {
  let response = 'Sketch Exception'

  try {
    await startInNewWindow(args.command)
    response = `test command: ${args.command} success`
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
