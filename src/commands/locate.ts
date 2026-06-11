import { Command } from 'commander'
import {
  handleSketchHtmlLocate,
  sketchLocateInputSchema
} from '@/services/sketchHtmlLocate'
import { logger } from '@/utils/logger'

async function handleLocate(opts: Record<string, unknown>) {
  if (typeof opts.offset === 'string') {
    opts.offset = Number(opts.offset)
  }
  if (typeof opts.limit === 'string') {
    opts.limit = Number(opts.limit)
  }
  const args = sketchLocateInputSchema.parse(opts)
  const text = await handleSketchHtmlLocate(args)
  console.log(text)
}

export const locate = new Command()
  .name('locate')
  .description(
    'Returns the layers with high layout score from the Sketch Meaxure export archive (zip or folder)'
  )
  .option('-p, --file_path <PATH>', 'Sketch HTML export path (zip or folder)')
  .option('--pn, --page_name [PAGENAME]', 'Page name')
  .option('--an, --artboard_name [ARTBOARDNAME]', 'Artboard name')
  .option(
    '-o, --offset [OFFSET]',
    'starting index in sorted layers (optional, default 0)'
  )
  .option(
    '-l, --limit [LIMIT]',
    'number of layers to return (optional, default 10)'
  )
  .action((opts: Record<string, unknown>) => {
    handleLocate(opts).catch(err => {
      logger.error(err, 'sketch-cli locate')
      process.exit(1)
    })
  })
