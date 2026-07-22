import { Command } from 'commander'
import { sketchPreview, sketchPreviewInputSchema } from '@/services/preview'
import { logger } from '@/utils/logger'

async function handlePreview(opts: Record<string, unknown>) {
  const args = sketchPreviewInputSchema.parse(opts)
  const text = await sketchPreview(args)
  console.log(text)
}

export const preview = new Command()
  .name('preview')
  .description('Preview a URL in the browser')
  .requiredOption(
    '-f, --file_path <PATH>',
    'Sketch HTML export path (zip or folder)'
  )
  .requiredOption('--pn, --page_name <PAGENAME>', 'Page name')
  .requiredOption('--an, --artboard_name <ARTBOARDNAME>', 'Artboard name')
  .requiredOption('-u, --url <URL>', 'Preview URL')
  .action((opts: Record<string, unknown>) => {
    handlePreview(opts).catch(err => {
      logger.error(err, 'sketch-cli preview')
      process.exit(1)
    })
  })
