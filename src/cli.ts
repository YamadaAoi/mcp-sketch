import { Command } from 'commander'
import { analyze } from '@/commands/analyze'
import { plan } from '@/commands/plan'

export function startCli() {
  const program = new Command()
    .name('mcp-sketch')
    .description('A CLI tool for analyzing Sketch Meaxure zip files')
    .version(__VERSION__, '-v, --version', 'Show version number')

  program.addCommand(plan)
  program.addCommand(analyze)

  program.parse()
}
