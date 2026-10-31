import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import prompts from 'prompts'
import { getEnv } from '@/utils/env'
import { install } from './installer'
import { SkillPool } from './skill'

export const sketchInstallInputSchema = z.object({})

export type SketchInstallInputSchema = SchemaOutput<
  typeof sketchInstallInputSchema
>

export async function sketchInstall(_args: SketchInstallInputSchema) {
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
  if (!result.agent) {
    throw new Error('Agent selection canceled')
  }
  const cwd = getEnv('CWD')
  await install(cwd, result.agent as string, SkillPool)
}
