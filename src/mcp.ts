import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { tools } from '@/tools'
import { logger } from '@/utils/logger'

export function startMcp() {
  const server = new McpServer({
    name: 'sketch-mcp-server',
    version: __VERSION__
  })

  tools.forEach(([name, config, cb]) => {
    server.registerTool(name, config, cb)
  })

  const transport = new StdioServerTransport()

  server.connect(transport).catch(error => {
    logger.error(error)
  })
}
