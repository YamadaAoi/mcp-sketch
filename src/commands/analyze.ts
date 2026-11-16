import { Command, Option } from 'commander'
import { sketchAnalyze, sketchAnalyzeInputSchema } from '@/services/analyze'
import { logger } from '@/utils/logger'

async function handleAnalyze(opts: Record<string, unknown>) {
  // -p/-a 为当前写法；旧拼写 --pn/--an（及 --page_name/--artboard_name）作为隐藏别名继续可用
  const page = opts.page ?? opts.page_name
  const artboard = opts.artboard ?? opts.artboard_name
  if (!page || !artboard) {
    throw new Error(
      'missing required options: -p, --page <NAME> and -a, --artboard <NAME> (page/artboard names come from the `list` output)'
    )
  }

  const raw: Record<string, unknown> = {
    file_path: opts.file_path,
    page_name: page,
    artboard_name: artboard
  }
  for (const key of [
    'rect',
    'exclude_rects',
    'assets_path',
    'name',
    'type',
    'limit',
    'offset'
  ]) {
    if (opts[key] !== undefined) raw[key] = opts[key]
  }
  if (typeof raw.rect === 'string') raw.rect = JSON.parse(raw.rect)
  if (typeof raw.exclude_rects === 'string') {
    raw.exclude_rects = JSON.parse(raw.exclude_rects)
  }
  if (typeof raw.limit === 'string') raw.limit = Number(raw.limit)
  if (typeof raw.offset === 'string') raw.offset = Number(raw.offset)

  const args = sketchAnalyzeInputSchema.parse(raw)
  const text = await sketchAnalyze(args)
  console.log(text)
}

export const analyze = new Command()
  .name('analyze')
  .description(
    "Extract one artboard's design structure: positional layer rows (name/type/rect/content/css/assets) ranked by layout weight, with region/name/type filters and pagination; results cached per parameters under .sketch-cache/"
  )
  .requiredOption(
    '-f, --file_path <PATH>',
    'Sketch Meaxure export path (zip or folder)'
  )
  .option('-p, --page <NAME>', 'Page name (required; as shown by `list`)')
  .option(
    '-a, --artboard <NAME>',
    'Artboard name (required; as shown by `list`)'
  )
  .addOption(
    new Option('--pn, --page_name <NAME>', 'legacy alias of --page').hideHelp()
  )
  .addOption(
    new Option(
      '--an, --artboard_name <NAME>',
      'legacy alias of --artboard'
    ).hideHelp()
  )
  .option(
    '-r, --rect [RECT]',
    'Region filter `[x, y, width, height]` (x, y = top-left corner): layers fully inside go to `layers`, ~10px straddles to `adjacent`; a cropped preview of the region is generated alongside'
  )
  .option(
    '-e, --exclude_rects [EXCLUDE_RECTS]',
    'Exclude regions `[[x, y, width, height], ...]`: only layers fully inside are dropped — mark areas already implemented'
  )
  .option(
    '--ap, --assets_path [ASSETSPATH]',
    'Asset output dir (default: ASSETS_PATH from .env.sketch, or src/assets/sketch)'
  )
  .option(
    '-n, --name [NAME]',
    'Filter layers by name keyword (case-insensitive substring), e.g. `-n logo`'
  )
  .option(
    '-t, --type [TYPE]',
    "Filter layers by type: text | shape | slice (e.g. `-t text` returns the artboard's full copy list)"
  )
  .option(
    '-l, --limit [LIMIT]',
    'Return only the top N layers by layout weight (large containers rank first)'
  )
  .option(
    '-o, --offset [OFFSET]',
    'Pagination start index (default 0); pairs with -l'
  )
  .addHelpText(
    'after',
    `
Examples:
  $ mcp-sketch list -f "design.zip"                                                   # start here: page/artboard names + data size
  $ mcp-sketch analyze -f "design.zip" -p "Home" -a "Login" -l 20                     # top-20 skeleton of the artboard
  $ mcp-sketch analyze -f "design.zip" -p "Home" -a "Login" -t "slice"                # asset inventory (webp paths)
  $ mcp-sketch analyze -f "design.zip" -p "Home" -a "Login" -t "text"                 # copy inventory
  $ mcp-sketch analyze -f "design.zip" -p "Home" -a "Login" -r "[695,200,530,660]"    # region deep-read (+ cropped preview)
  $ mcp-sketch analyze -f "design.zip" -p "Home" -a "Login" -e "[[695,200,530,660]]"  # exclude finished regions
  $ mcp-sketch analyze -f "design.zip" -p "Home" -a "Login" -n "logo"                 # locate layers by name`
  )
  .action((opts: Record<string, unknown>) => {
    handleAnalyze(opts).catch(err => {
      logger.error(err, 'sketch-cli analyze')
      process.exit(1)
    })
  })
