import { Command } from 'commander'
import { install } from '@/commands/install'
import { list } from './commands/list'
import { analyze } from '@/commands/analyze'
import { dev } from '@/commands/dev'
import { compare } from '@/commands/compare'

export function startCli() {
  const program = new Command()
    .name('mcp-sketch')
    .description(
      'Turn Sketch Meaxure exports (zip or folder) into frontend code: list artboards, extract layer data, export webp assets, and score screenshots against previews. Run `mcp-sketch <command> --help` for usage and examples'
    )
    .version(__VERSION__, '-v, --version', 'Show version number')

  program.addCommand(install)
  program.addCommand(list)
  program.addCommand(analyze)
  program.addCommand(dev)
  program.addCommand(compare)

  program.parse()
}
