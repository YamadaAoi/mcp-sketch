import { Command } from 'commander'
import { install } from '@/commands/install'
import { list } from './commands/list'
import { analyze } from '@/commands/analyze'
import { checkPort } from '@/commands/checkPort'
import { preview } from '@/commands/preview'
import { screenshot } from '@/commands/screenshot'

export function startCli() {
  const program = new Command()
    .name('mcp-sketch')
    .description(
      'A CLI tool for analyzing Sketch Meaxure exported archives (zip or folder)'
    )
    .version(__VERSION__, '-v, --version', 'Show version number')

  program.addCommand(install)
  program.addCommand(list)
  program.addCommand(analyze)
  program.addCommand(checkPort)
  program.addCommand(preview)
  program.addCommand(screenshot)

  program.parse()
}
