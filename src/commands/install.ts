import { Command } from 'commander'
import { sketchInstall, sketchInstallInputSchema } from '@/services/install'
import { logger } from '@/utils/logger'

async function handleInstall(opts: Record<string, unknown>) {
  const args = sketchInstallInputSchema.parse(opts)
  await sketchInstall(args)
}

export const install = new Command()
  .name('install')
  .description(
    'Scaffold mcp-sketch skills and agents to generate frontend code from artboards'
  )
  .action((opts: Record<string, unknown>) => {
    handleInstall(opts).catch(err => {
      logger.error(err, 'sketch-cli install')
      process.exit(1)
    })
  })
