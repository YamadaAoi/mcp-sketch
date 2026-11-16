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
    'List every artboard with its preview path and data size, plus design tokens (colors/fonts/radii/shadows/named styles); writes .sketch-cache/{design}/list.json — start here to pick page/artboard names'
  )
  .requiredOption(
    '-f, --file_path <PATH>',
    'Sketch Meaxure export path (zip or folder)'
  )
  .addHelpText(
    'after',
    `
Examples:
  $ mcp-sketch list -f "design.zip"`
  )
  .action((opts: Record<string, unknown>) => {
    handleList(opts).catch(err => {
      logger.error(err, 'sketch-cli list')
      process.exit(1)
    })
  })
