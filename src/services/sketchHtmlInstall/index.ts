import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import prompts from 'prompts'
import { logger } from '@/utils/logger'
import { install } from './installer'
import { AgentPool } from './agent'
import { SkillPool } from './skill'

export const sketchInstallInputSchema = z.object({
  cwd: z
    .string()
    .describe('current working directory, default is current directory')
})

export type SketchInstallInputSchema = SchemaOutput<
  typeof sketchInstallInputSchema
>

export async function handleSketchHtmlInstall(args: SketchInstallInputSchema) {
  const result = await prompts({
    type: 'select',
    name: 'agent',
    message: 'Select your AI coding agent',
    hint: '↑/↓ to navigate, enter to select',
    choices: [
      {
        title: 'ClaudeCode',
        value: 'claude'
      },
      {
        title: 'OpenCode',
        value: 'opencode'
      }
    ]
  })
  if (result.agent) {
    const pool = [...AgentPool, ...SkillPool]
    await install(args.cwd, result.agent as string, pool)
  } else {
    logger.error('Agent selection canceled')
    process.exit(1)
  }
}
