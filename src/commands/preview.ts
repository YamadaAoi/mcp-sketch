import { Command } from 'commander'
import { sketchPreview, sketchPreviewInputSchema } from '@/services/preview'
import { logger } from '@/utils/logger'

async function handlePreview(opts: Record<string, unknown>) {
  const args = sketchPreviewInputSchema.parse(opts)
  const text = await sketchPreview(args)
  console.log(text)
  process.exit(0)
}

export const preview = new Command()
  .name('preview')
  .description('Preview a URL in the browser')
  .requiredOption('-u, --url <URL>', 'Preview URL')
  .requiredOption('-c, --command <Command>', 'command to start local server')
  .option('-p, --projectPath <ProjectPath>', 'Project path')
  .action((opts: Record<string, unknown>) => {
    handlePreview(opts).catch(err => {
      logger.error(err, 'sketch-cli preview')
      process.exit(1)
    })
  })
