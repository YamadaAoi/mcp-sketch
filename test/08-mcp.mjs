import fs from 'node:fs'
import path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import {
  makeWorkspace,
  assert,
  assertEq,
  runSuite,
  CLI,
  COLS,
  FIXTURE_ZIP,
  PAGE,
  TMP_DIR
} from './helpers.mjs'

const ws = makeWorkspace('08-mcp')

const env = { ...process.env, MCP_MODE: '1' }
delete env.PREVIEW_URL

let client
try {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [CLI],
    cwd: ws,
    env
  })
  client = new Client({ name: 'mcp-sketch-test', version: '0.0.0' })
  await client.connect(transport)
} catch (e) {
  console.error('MCP client connect failed:', e)
  process.exit(1)
}

function textOf(res) {
  assertEq(res.content?.[0]?.type, 'text', 'tool result is text')
  return res.content[0].text
}

function parseListText(text) {
  const marker = '\n\nsaved to '
  const idx = text.indexOf(marker)
  assert(idx > 0, 'list tool text contains saved-to footer')
  const listPath = text.slice(idx + marker.length).trim()
  assert(fs.existsSync(listPath), `list.json written (${listPath})`)
  return JSON.parse(text.slice(0, idx))
}

await runSuite('08-mcp: stdio server handshake & tools', [
  [
    'handshake: server exposes exactly 4 tools',
    async () => {
      const { tools } = await client.listTools()
      assertEq(
        tools.map(t => t.name).sort(),
        ['sketch_analyze', 'sketch_compare', 'sketch_dev', 'sketch_list'],
        'registered tool names'
      )
    }
  ],
  [
    'sketch_list: returns artboards and writes list.json',
    async () => {
      const res = await client.callTool({
        name: 'sketch_list',
        arguments: { file_path: FIXTURE_ZIP }
      })
      assert(!res.isError, 'list tool succeeded')
      const data = parseListText(textOf(res))
      assertEq(data.artboards.length, 10, 'artboards via MCP')
    }
  ],
  [
    'sketch_analyze: positional layer data via MCP',
    async () => {
      const res = await client.callTool({
        name: 'sketch_analyze',
        arguments: {
          file_path: FIXTURE_ZIP,
          page_name: PAGE,
          artboard_name: '登录'
        }
      })
      assert(!res.isError, 'analyze tool succeeded')
      const d = JSON.parse(textOf(res))
      assertEq(d.columns, COLS, 'columns via MCP')
      assertEq(d.total, 15, 'total via MCP')
      for (const row of d.layers) assertEq(row.length, 10, 'row width')
    }
  ],
  [
    'sketch_analyze: unknown artboard → isError with not-found text',
    async () => {
      const res = await client.callTool({
        name: 'sketch_analyze',
        arguments: {
          file_path: FIXTURE_ZIP,
          page_name: PAGE,
          artboard_name: '不存在的画板'
        }
      })
      assertEq(res.isError, true, 'isError set')
      assert(textOf(res).includes('not found'), 'error text mentions not found')
    }
  ],
  [
    'sketch_dev: PREVIEW_URL missing → isError',
    async () => {
      const res = await client.callTool({
        name: 'sketch_dev',
        arguments: {}
      })
      assertEq(res.isError, true, 'isError set')
      assert(textOf(res).includes('PREVIEW_URL'), 'error mentions PREVIEW_URL')
    }
  ],
  [
    'workspace isolation: outputs land under the MCP cwd workspace',
    async () => {
      const cache = path.join(ws, '.sketch-cache')
      assert(fs.existsSync(cache), '.sketch-cache created in workspace')
      assert(
        fs.existsSync(path.join(TMP_DIR, '08-mcp', '.sketch-cache')),
        'resolved inside test workspace'
      )
    }
  ]
])

await client.close().catch(() => {})
