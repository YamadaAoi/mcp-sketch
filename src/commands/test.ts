import { Command } from 'commander'
import { sketchTest, sketchTestInputSchema } from '@/services/test'
import { logger } from '@/utils/logger'

async function handleTest(opts: Record<string, unknown>) {
  const args = sketchTestInputSchema.parse(opts)
  const text = await sketchTest(args)
  console.log(text)
}

export const test = new Command()
  .name('test')
  .description('Test a command')
  .option('-c, --command <Command>', 'command to test')
  .action((opts: Record<string, unknown>) => {
    handleTest(opts).catch(err => {
      logger.error(err, 'sketch-cli test')
      process.exit(1)
    })
  })
