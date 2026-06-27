import { Command } from 'commander'
import {
  handleSketchHtmlAnalyze,
  sketchAnalyzeInputSchema
} from '@/services/sketchHtmlAnalyze'
import { logger } from '@/utils/logger'

async function handleAnalyze(opts: Record<string, unknown>) {
  if (typeof opts.rect === 'string') {
    opts.rect = JSON.parse(opts.rect)
  }
  if (typeof opts.exclude_rects === 'string') {
    opts.exclude_rects = JSON.parse(opts.exclude_rects)
  }
  if (typeof opts.offset === 'string') {
    opts.offset = Number(opts.offset)
  }
  if (typeof opts.limit === 'string') {
    opts.limit = Number(opts.limit)
  }
  const args = sketchAnalyzeInputSchema.parse(opts)
  const text = await handleSketchHtmlAnalyze(args)
  console.log(text)
}

export const analyze = new Command()
  .name('analyze')
  .description(
    'parsing Sketch Meaxure exported HTML archives (zip or folder) and extracting design structure information'
  )
  .option('-p, --file_path <PATH>', 'Sketch HTML export path (zip or folder)')
  .option('--pn, --page_name [PAGENAME]', 'Page name')
  .option('--an, --artboard_name [ARTBOARDNAME]', 'Artboard name')
  .option(
    '-r, --rect [RECT]',
    'Specify rectangular region to parse, format: `[x, y, width, height]` (x, y is top-left corner)'
  )
  .option(
    '-e, --exclude_rects [EXCLUDE_RECTS]',
    'Specify rectangular regions to exclude, format: `[x, y, width, height]` (x, y is top-left corner)'
  )
  .option(
    '--ap, --assets_path [ASSETSPATH]',
    'Assets output path, default: `src/assets/sketch`'
  )
  .option(
    '-l, --limit [LIMIT]',
    'Number of top-scored layers to return (optional)'
  )
  .option(
    '-o, --offset [OFFSET]',
    'Starting index in sorted layers (optional, default 0)'
  )
  .action((opts: Record<string, unknown>) => {
    handleAnalyze(opts).catch(err => {
      logger.error(err, 'sketch-cli analyze')
      process.exit(1)
    })
  })
