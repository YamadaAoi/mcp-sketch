import { Command } from 'commander'
import { install } from '@/commands/install'
import { list } from './commands/list'
import { plan } from '@/commands/plan'
import { analyze } from '@/commands/analyze'

export function startCli() {
  const program = new Command()
    .name('mcp-sketch')
    .description(
      'A CLI tool for analyzing Sketch Meaxure exported archives (zip or folder)'
    )
    .version(__VERSION__, '-v, --version', 'Show version number')

  program.addCommand(install)
  program.addCommand(list)
  program.addCommand(plan)
  program.addCommand(analyze)

  program.parse()
}
