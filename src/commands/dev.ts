import { Command } from 'commander'
import { sketchDev } from '@/services/dev'
import { logger } from '@/utils/logger'

async function handleDev() {
  const text = await sketchDev()
  console.log(text)
}

export const dev = new Command()
  .name('dev')
  .description(
    'Start (or reuse) the dev server in the background and poll PREVIEW_URL until it responds; run this before screenshotting for compare (PREVIEW_URL must be configured in .env.sketch)'
  )
  .action(() => {
    handleDev().catch(err => {
      logger.error(err, 'sketch-cli dev')
      process.exit(1)
    })
  })
