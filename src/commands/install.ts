import { Command } from 'commander'
import {
  handleSketchHtmlInstall,
  sketchInstallInputSchema
} from '@/services/sketchHtmlInstall'
import { logger } from '@/utils/logger'

async function handleInstall(opts: Record<string, unknown>) {
  const args = sketchInstallInputSchema.parse(opts)
  await handleSketchHtmlInstall(args)
}

export const install = new Command()
  .name('install')
  .description(
    'Scaffold mcp-sketch skills and agents to generate frontend code from artboards'
  )
  .option(
    '-c, --cwd <CWD>',
    'current working directory, default is current directory',
    process.cwd()
  )
  .action((opts: Record<string, unknown>) => {
    handleInstall(opts).catch(err => {
      logger.error(err, 'sketch-cli install')
      process.exit(1)
    })
  })
