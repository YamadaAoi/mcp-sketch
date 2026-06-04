import { Command } from 'commander'
import {
  handleSketchHtmlLocate,
  sketchLocateInputSchema
} from '@/services/sketchHtmlLocate'
import { logger } from '@/utils/logger'

async function handleLocate(opts: Record<string, unknown>) {
  if (typeof opts.rank === 'string') {
    opts.rank = Number(opts.rank)
  }
  const args = sketchLocateInputSchema.parse(opts)
  const text = await handleSketchHtmlLocate(args)
  console.log(text)
}

export const locate = new Command()
  .name('locate')
  .description(
    'Returns the layers with high layout score rank from the Sketch Meaxure export archive (zip or folder)'
  )
  .option('-p, --file_path <PATH>', 'Sketch HTML export path (zip or folder)')
  .option('--pn, --page_name [PAGENAME]', 'Page name')
  .option('--an, --artboard_name [ARTBOARDNAME]', 'Artboard name')
  .option('-r, --rank [RANK]', 'Layer layout score rank (optional)')
  .action((opts: Record<string, unknown>) => {
    handleLocate(opts).catch(err => {
      logger.error(err, 'sketch-cli locate')
      process.exit(1)
    })
  })
