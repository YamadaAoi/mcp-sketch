import { Command } from 'commander'
import { sketchState, sketchStateInputSchema } from '@/services/state'
import { logger } from '@/utils/logger'

async function handleState(opts: Record<string, unknown>) {
  const args = sketchStateInputSchema.parse(opts)
  const text = await sketchState(args)
  console.log(text)
  process.exit(0)
}

export const state = new Command()
  .name('state')
  .description('Create or update artboard state file')
  .requiredOption('--pn, --page_name [PAGENAME]', 'Page name')
  .requiredOption('--an, --artboard_name [ARTBOARDNAME]', 'Artboard name')
  .requiredOption('-c, --content <json>', 'JSON content to create or update')
  .option('--clean', 'just delete component & md files', false)
  .option('-r, --replace', 'replace component list, instead of merge', false)
  .option('-p, --projectPath <ProjectPath>', 'Project path')
  .action((opts: Record<string, unknown>) => {
    handleState(opts).catch(err => {
      logger.error(err, 'sketch-cli state')
      process.exit(1)
    })
  })
