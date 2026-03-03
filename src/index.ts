#!/usr/bin/env node
import { MCPServer } from './utils/mcpServer'
import { createSketchTools } from './services'

function main() {
  const server = new MCPServer('local-mcp-sketch-server', __VERSION__)

  const sketchTool = createSketchTools()
  server.registerTools(sketchTool)

  server.start()
}

main()
