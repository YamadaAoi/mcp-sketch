import { Command } from 'commander'
import {
  sketchCheckPort,
  sketchCheckPortInputSchema
} from '@/services/checkPort'
import { logger } from '@/utils/logger'

async function handleCheckPort(opts: Record<string, unknown>) {
  if (typeof opts.port === 'string') {
    opts.port = Number(opts.port)
  }
  const args = sketchCheckPortInputSchema.parse(opts)
  const text = await sketchCheckPort(args)
  console.log(text)
}

export const checkPort = new Command()
  .name('check-port')
  .description('Check if a port is open on a host')
  .option('-p, --port <PORT>', 'Port number')
  .option('-h, --host [HOST]', 'Host address', 'localhost')
  .action((opts: Record<string, unknown>) => {
    handleCheckPort(opts).catch(err => {
      logger.error(err, 'sketch-cli check-port')
      process.exit(1)
    })
  })
