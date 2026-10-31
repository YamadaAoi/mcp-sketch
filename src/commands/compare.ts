import { Command } from 'commander'
import { sketchCompare, sketchCompareInputSchema } from '@/services/compare'
import { logger } from '@/utils/logger'

async function handleCompare(opts: Record<string, unknown>) {
  const args = sketchCompareInputSchema.parse(opts)
  const text = await sketchCompare(args)
  console.log(text)
}

export const compare = new Command()
  .name('compare')
  .description(
    'Compare a browser screenshot with the artboard preview image, return similarity score and diff image'
  )
  .requiredOption(
    '-f, --file_path <PATH>',
    'Sketch HTML export path (zip or folder)'
  )
  .requiredOption('--pn, --page_name <PAGENAME>', 'Page name')
  .requiredOption('--an, --artboard_name <ARTBOARDNAME>', 'Artboard name')
  .requiredOption(
    '-s, --screenshot_path <PATH>',
    'Browser screenshot file path to compare'
  )
  .action((opts: Record<string, unknown>) => {
    handleCompare(opts).catch(err => {
      logger.error(err, 'sketch-cli compare')
      process.exit(1)
    })
  })
