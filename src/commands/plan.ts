import { Command } from 'commander'
import {
  handleSketchHtmlPlan,
  sketchPlanInputSchema
} from '@/services/sketchHtmlPlan'
import { logger } from '@/utils/logger'

async function handlePlan(opts: Record<string, unknown>) {
  const args = sketchPlanInputSchema.parse(opts)
  const text = await handleSketchHtmlPlan(args)
  console.log(text)
}

export const plan = new Command()
  .name('plan')
  .description(
    'Returns the preview image path and other basic data for the specified artboard from the Sketch Meaxure export zip.'
  )
  .option('-p, --file_path <PATH>', 'Sketch HTML zip archive path')
  .option('--pn, --page_name [PAGENAME]', 'Page name')
  .option('--an, --artboard_name [ARTBOARDNAME]', 'Artboard name')
  .action((opts: Record<string, unknown>) => {
    handlePlan(opts).catch(err => {
      logger.error(err, 'sketch-cli analyze')
      process.exit(1)
    })
  })
