import { Command } from 'commander'
import {
  handleSketchHtmlList,
  sketchListInputSchema
} from '@/services/sketchHtmlList'
import { logger } from '@/utils/logger'

async function handleList(opts: Record<string, unknown>) {
  const args = sketchListInputSchema.parse(opts)
  const text = await handleSketchHtmlList(args)
  console.log(text)
}

export const list = new Command()
  .name('list')
  .description(
    'List the artboards from the Sketch Meaxure export archive (zip or folder).'
  )
  .option('-p, --file_path <PATH>', 'Sketch HTML export path (zip or folder)')
  .action((opts: Record<string, unknown>) => {
    handleList(opts).catch(err => {
      logger.error(err, 'sketch-cli list')
      process.exit(1)
    })
  })
