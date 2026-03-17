#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { tools } from '@/tools'

function main() {
  const server = new McpServer({
    name: 'sketch-mcp-server',
    version: __VERSION__
  })

  tools.forEach(([name, config, cb]) => {
    server.registerTool(name, config, cb)
  })
}

main()
