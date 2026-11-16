import { Command } from 'commander'
import { sketchCompare, sketchCompareInputSchema } from '@/services/compare'
import { logger } from '@/utils/logger'

async function handleCompare(opts: Record<string, unknown>) {
  const args = sketchCompareInputSchema.parse({
    base_image: opts.base_image,
    screenshot_path: opts.screenshot_path
  })
  const text = await sketchCompare(args)
  console.log(text)
}

export const compare = new Command()
  .name('compare')
  .description(
    'Diff two images pixel-wise: a design base image vs an implementation screenshot (0~1 similarity + diff image), enabling an "edit code → screenshot → compare" convergence loop'
  )
  .requiredOption(
    '-b, --base_image <PATH>',
    'Base image path (design side): the artboard previewPath from `list` for a whole page, or the region previewPath from `analyze -r` for a component'
  )
  .requiredOption(
    '-s, --screenshot_path <PATH>',
    'Implementation screenshot path (page side): a full-page or element screenshot (e.g. from Playwright)'
  )
  .addHelpText(
    'after',
    `
Examples:
  $ mcp-sketch compare -b "{preview_image_path}" -s "{screenshot_path}"        # whole page: base = artboard preview (from list), screenshot = full page
  $ mcp-sketch compare -b "{region_preview_path}" -s "{element_shot_path}"     # component: base = analyze -r previewPath (pre-cropped), screenshot = element shot`
  )
  .action((opts: Record<string, unknown>) => {
    handleCompare(opts).catch(err => {
      logger.error(err, 'sketch-cli compare')
      process.exit(1)
    })
  })
