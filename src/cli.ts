import { Command } from 'commander'
import { analyze } from '@/commands/analyze'

export function startCli() {
  const program = new Command()
    .name('mcp-sketch')
    .description('A CLI tool for analyzing Sketch Html zip files')
    .version(__VERSION__, '-v, --version', 'Show version number')

  program.addCommand(analyze)

  program.parse()
}
