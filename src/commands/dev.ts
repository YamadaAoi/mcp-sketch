import { Command } from 'commander'
import { sketchDev, sketchDevInputSchema } from '@/services/dev'
import { logger } from '@/utils/logger'

async function handleDev(opts: Record<string, unknown>) {
  const args = sketchDevInputSchema.parse(opts)
  const text = await sketchDev(args)
  console.log(text)
}

export const dev = new Command()
  .name('dev')
  .description('Start dev server for previewing')
  .requiredOption('-u, --url <URL>', 'Preview URL')
  .action((opts: Record<string, unknown>) => {
    handleDev(opts).catch(err => {
      logger.error(err, 'sketch-cli dev')
      process.exit(1)
    })
  })
