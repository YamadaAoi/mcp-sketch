import { Command } from 'commander'
import { sketchList, sketchListInputSchema } from '@/services/list'
import { logger } from '@/utils/logger'

async function handleList(opts: Record<string, unknown>) {
  const args = sketchListInputSchema.parse(opts)
  const text = await sketchList(args)
  console.log(text)
}

export const list = new Command()
  .name('list')
  .description(
    'List the artboards from the Sketch Meaxure export archive (zip or folder).'
  )
  .option('-f, --file_path <PATH>', 'Sketch HTML export path (zip or folder)')
  .action((opts: Record<string, unknown>) => {
    handleList(opts).catch(err => {
      logger.error(err, 'sketch-cli list')
      process.exit(1)
    })
  })
