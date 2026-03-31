import { Command } from 'commander'
import { sketchHtmlInputSchema } from '@/types'
import { handleSketchHtmlAnalyze } from '@/services/sketchHtmlAnalyze'
import { logger } from '@/utils/logger'

async function handleAnalyze(opts: Record<string, unknown>) {
  if (typeof opts.rect === 'string') {
    opts.rect = JSON.parse(opts.rect)
  }
  if (typeof opts.save_result === 'string') {
    opts.save_result = opts.save_result === 'true'
  }
  const args = sketchHtmlInputSchema.parse(opts)
  const text = await handleSketchHtmlAnalyze(args)
  console.log(text)
}

export const analyze = new Command()
  .name('analyze')
  .description(
    'parsing Sketch exported HTML zip archives and extracting design structure information'
  )
  .option('-p, --file_path <PATH>', 'Sketch HTML zip archive path')
  .option('--pid, --page_id [PAGEID]', 'Page ID')
  .option('--pn, --page_name [PAGENAME]', 'Page name')
  .option('--aid, --artboard_id [ARTBOARDID]', 'Artboard ID')
  .option('--an, --artboard_name [ARTBOARDNAME]', 'Artboard name')
  .option(
    '-r, --rect [RECT]',
    'Specify rectangular region to parse, format: `[x, y, width, height]` (x, y is top-left corner)'
  )
  .option(
    '--ap, --assets_path [ASSETSPATH]',
    'Assets output path, default: `src/assets/sketch`'
  )
  .option(
    '--sr, --save_result [SAVERESULT]',
    'Whether to save analysis result to local file, default: `true`',
    true
  )
  .action((opts: Record<string, unknown>) => {
    handleAnalyze(opts).catch(err => {
      logger.error(err, 'sketch-cli analyze')
      process.exit(1)
    })
  })
