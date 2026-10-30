import { Command } from 'commander'
import { sketchDev } from '@/services/dev'
import { logger } from '@/utils/logger'

async function handleDev() {
  const text = await sketchDev()
  console.log(text)
}

export const dev = new Command()
  .name('dev')
  .description('Start dev server for previewing')
  .action(() => {
    handleDev().catch(err => {
      logger.error(err, 'sketch-cli dev')
      process.exit(1)
    })
  })
