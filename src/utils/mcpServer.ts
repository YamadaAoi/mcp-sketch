import { createInterface } from 'node:readline'
import { getLogger } from './logger.js'

const JSONRPC_VERSION = '2.0'
const PROTOCOL_VERSION = '2024-11-05'
const ERROR_CODE_METHOD_NOT_FOUND = -32601
const ERROR_CODE_INTERNAL_ERROR = -32603
const ERROR_CODE_INVALID_PARAMS = -32602

interface InitializeRequest {
  jsonrpc: '2.0'
  method: 'initialize'
  params?: MCPInitializeParams
  id: number | string
}

interface InitializedRequest {
  jsonrpc: '2.0'
  method: 'initialized'
  params?: unknown
  id?: number | string
}

interface ToolsListRequest {
  jsonrpc: '2.0'
  method: 'tools/list'
  params?: unknown
  id: number | string
}

interface ToolsCallRequest {
  jsonrpc: '2.0'
  method: 'tools/call'
  params: { name: string; arguments?: Record<string, unknown> }
  id: number | string
}

interface ShutdownRequest {
  jsonrpc: '2.0'
  method: 'shutdown'
  params?: unknown
  id: number | string
}

type JSONRPCRequest =
  | InitializeRequest
  | InitializedRequest
  | ToolsListRequest
  | ToolsCallRequest
  | ShutdownRequest

interface JSONRPCResponse {
  jsonrpc: '2.0'
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
  id: number | string | null
}

interface Tool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<
      string,
      {
        type: string
        description: string
      }
    >
    required?: string[]
  }
}

interface MCPInitializeParams {
  protocolVersion: string
  capabilities: {
    roots?: {
      listChanged?: boolean
    }
    sampling?: object
  }
  clientInfo: {
    name: string
    version: string
  }
}

interface MCPInitializeResult {
  protocolVersion: string
  capabilities: {
    tools: object
    resources?: object
    prompts?: object
  }
  serverInfo: {
    name: string
    version: string
  }
}

type ToolHandler = (args: Record<string, unknown>) => unknown

export interface ToolRegistration {
  tool: Tool
  handler: ToolHandler
}

function isValidMethod(method: string): boolean {
  return [
    'initialize',
    'initialized',
    'tools/list',
    'tools/call',
    'shutdown'
  ].includes(method)
}

export class MCPServer {
  #tools: Map<string, ToolRegistration> = new Map()
  #name: string
  #version: string
  #logger = getLogger()
  #requestHandlers: Map<
    string,
    (
      id: number | string | null,
      request?: JSONRPCRequest
    ) => JSONRPCResponse | Promise<JSONRPCResponse>
  > = new Map()

  constructor(name: string, version: string) {
    this.#name = name
    this.#version = version
    this.#initializeRequestHandlers()
    this.#registerDefaultTools()
    this.#logger.info(`MCP Server initialized: ${name} v${version}`)
  }

  #initializeRequestHandlers(): void {
    this.#requestHandlers.set('initialize', id => this.#handleInitialize(id))
    this.#requestHandlers.set('initialized', id => {
      this.#logger.debug('Client initialized')
      return { jsonrpc: JSONRPC_VERSION, result: null, id: id ?? null }
    })
    this.#requestHandlers.set('tools/list', id => this.#handleToolsList(id))
    this.#requestHandlers.set('tools/call', (id, request) =>
      this.#handleToolsCall(
        request?.params as {
          name: string
          arguments?: Record<string, unknown>
        },
        id
      )
    )
    this.#requestHandlers.set('shutdown', id => {
      this.#logger.info('Shutdown requested')
      return { jsonrpc: JSONRPC_VERSION, result: null, id }
    })
  }

  #registerDefaultTools(): void {
    this.#tools.set('echo', {
      tool: {
        name: 'echo',
        description: 'Echo back the input text',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to echo back'
            }
          },
          required: ['text']
        }
      },
      handler: (args: Record<string, unknown>) => {
        const text = args?.text as string
        return `Echo: ${text}`
      }
    })
  }

  registerTools(registrations: ToolRegistration[]): void {
    for (const registration of registrations) {
      this.#tools.set(registration.tool.name, registration)
      this.#logger.debug(`Registered tool: ${registration.tool.name}`)
    }
  }

  async #handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const { method, id } = request

    this.#logger.debug(`Received request: ${method}`, {
      id,
      params: request.params
    })

    try {
      if (!isValidMethod(method)) {
        this.#logger.warn(`Unknown method: ${method}`)
        return {
          jsonrpc: JSONRPC_VERSION,
          error: {
            code: ERROR_CODE_METHOD_NOT_FOUND,
            message: `Method not found: ${method}`
          },
          id: id ?? null
        }
      }

      const handler = this.#requestHandlers.get(method)
      if (handler) {
        const response = await Promise.resolve(
          handler(id ?? null, request) as Promise<JSONRPCResponse>
        )
        this.#logger.debug(`Sending response: ${method}`, {
          id,
          result: response.result,
          error: response.error
        })
        return response
      }

      this.#logger.warn(`Unknown method: ${method}`)
      return {
        jsonrpc: JSONRPC_VERSION,
        error: {
          code: ERROR_CODE_METHOD_NOT_FOUND,
          message: `Method not found: ${method}`
        },
        id: id ?? null
      }
    } catch (error) {
      this.#logger.error(`Error handling request: ${method}`, error)
      return {
        jsonrpc: JSONRPC_VERSION,
        error: {
          code: ERROR_CODE_INTERNAL_ERROR,
          message: error instanceof Error ? error.message : 'Internal error'
        },
        id: id ?? null
      }
    }
  }

  #handleInitialize(id: number | string | null): JSONRPCResponse {
    const result: MCPInitializeResult = {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: this.#name,
        version: this.#version
      }
    }

    return { jsonrpc: JSONRPC_VERSION, result, id }
  }

  #handleToolsList(id: number | string | null): JSONRPCResponse {
    const tools = Array.from(this.#tools.values()).map(({ tool }) => tool)

    return {
      jsonrpc: JSONRPC_VERSION,
      result: { tools },
      id
    }
  }

  async #handleToolsCall(
    params: { name: string; arguments?: Record<string, unknown> },
    id: number | string | null
  ): Promise<JSONRPCResponse> {
    const { name, arguments: args } = params

    this.#logger.debug(`Tool called: ${name}`, { args })

    const registration = this.#tools.get(name)
    if (registration) {
      try {
        const result = registration.handler(args || {})
        const resolvedResult = await Promise.resolve(result)
        this.#logger.info(`Tool executed successfully: ${name}`)

        const toolResult = resolvedResult as {
          content?: Array<{ type: string; text: string }>
        }

        if (toolResult.content && Array.isArray(toolResult.content)) {
          return {
            jsonrpc: JSONRPC_VERSION,
            result: toolResult,
            id
          }
        } else {
          return {
            jsonrpc: JSONRPC_VERSION,
            result: {
              content: [
                {
                  type: 'text',
                  text: String(resolvedResult)
                }
              ]
            },
            id
          }
        }
      } catch (error) {
        this.#logger.error(`Tool execution failed: ${name}`, error)
        return {
          jsonrpc: JSONRPC_VERSION,
          error: {
            code: ERROR_CODE_INTERNAL_ERROR,
            message:
              error instanceof Error ? error.message : 'Tool execution error'
          },
          id
        }
      }
    }

    this.#logger.warn(`Unknown tool requested: ${name}`)
    return {
      jsonrpc: JSONRPC_VERSION,
      error: {
        code: ERROR_CODE_INVALID_PARAMS,
        message: `Unknown tool: ${name}`
      },
      id
    }
  }

  start(): void {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    })

    this.#logger.info('MCP Server started, waiting for requests...')

    rl.on('line', line => {
      if (!line.trim()) return

      try {
        const request: JSONRPCRequest = JSON.parse(line) as JSONRPCRequest

        this.#handleRequest(request)
          .then(response => {
            try {
              const json = JSON.stringify(response)
              process.stdout.write(json + '\n')
            } catch (error) {
              this.#logger.error('Error serializing response', error)
              console.error('Error serializing response:', error)
            }
          })
          .catch(error => {
            this.#logger.error('Error handling request', error)
            console.error('Error handling request:', error)
          })
      } catch (error) {
        this.#logger.error('Error parsing request', { line, error })
        console.error('Error parsing request:', error)
      }
    })
  }
}
