#!/usr/bin/env node
import dotenv from 'dotenv'
import { startCli } from '@/cli'
import { startMcp } from '@/mcp'

dotenv.config({ path: '.sketch.env', encoding: 'utf-8', quiet: true })
process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

const isMcp = process.env.MCP_MODE === '1' || process.env.MCP_MODE === 'true'

if (isMcp) {
  startMcp()
} else {
  startCli()
}
