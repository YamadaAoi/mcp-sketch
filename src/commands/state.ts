import { Command } from 'commander'
import { sketchState, sketchStateInputSchema } from '@/services/state'
import { logger } from '@/utils/logger'

async function handleState(opts: Record<string, unknown>) {
  const args = sketchStateInputSchema.parse(opts)
  const text = await sketchState(args)
  console.log(text)
}

export const state = new Command()
  .name('state')
  .description('Create or update artboard state file')
  .requiredOption('-f, --file_path <filePath>', 'Design file path')
  .requiredOption('--pn, --page_name [PAGENAME]', 'Page name')
  .requiredOption('--an, --artboard_name [ARTBOARDNAME]', 'Artboard name')
  .requiredOption(
    '-c, --content <yaml>',
    'Content data in YAML flow mapping format'
  )
  .option('-r, --replace', 'replace component list, instead of merge', false)
  .action((opts: Record<string, unknown>) => {
    handleState(opts).catch(err => {
      logger.error(err, 'sketch-cli state')
      process.exit(1)
    })
  })
