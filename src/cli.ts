#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import { analyze } from '@/commands/analyze'

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

function main() {
  const program = new Command()
    .name('sketch-cli')
    .description('A CLI tool for analyzing Sketch Html zip files')
    .version(__VERSION__, '-v, --version', 'Show version number')

  program.addCommand(analyze)

  program.parse()
}

main()
