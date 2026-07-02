import { Command } from 'commander'
import {
  sketchScreenshot,
  sketchScreenshotInputSchema
} from '@/services/screenshot'
import { logger } from '@/utils/logger'

async function handleScreenshot(opts: Record<string, unknown>) {
  const args = sketchScreenshotInputSchema.parse(opts)
  const text = await sketchScreenshot(args)
  console.log(text)
  process.exit(0)
}

export const screenshot = new Command()
  .name('screenshot')
  .description('Take a screenshot of a URL and save it')
  .option('-f, --file_path <PATH>', 'Sketch HTML export path (zip or folder)')
  .option('--pn, --page_name [PAGENAME]', 'Page name')
  .option('--an, --artboard_name [ARTBOARDNAME]', 'Artboard name')
  .option('-u, --url <URL>', 'Screenshot URL')
  .option('-p, --projectPath <ProjectPath>', 'Project path')
  .option('-c, --command <Command>', 'command to start local server')
  .action((opts: Record<string, unknown>) => {
    handleScreenshot(opts).catch(err => {
      logger.error(err, 'sketch-cli screenshot')
      process.exit(1)
    })
  })
