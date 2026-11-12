import fs from 'node:fs'
import path from 'node:path'
import {
  cli,
  parseJsonOutput,
  makeWorkspace,
  walkFiles,
  assert,
  assertEq,
  runSuite,
  FIXTURE_ZIP,
  analyzeLogin
} from './helpers.mjs'

const ws = makeWorkspace('03-assets')
const ASSETS_DIR = path.join(ws, 'src', 'assets', 'sketch')
const INDEX = path.join(ws, '.sketch-cache', 'assets-index.json')

function assetPathsOf(data) {
  return data.layers.flatMap(row => row[9])
}

await runSuite('03-assets: dedup, content-hash index, self-heal', [
  [
    'assets written to disk as webp files, referenced by relative paths',
    async () => {
      const d = analyzeLogin(ws)
      const paths = assetPathsOf(d)
      assert(paths.length > 0, '登录 exports assets')
      for (const p of paths) {
        assert(!path.isAbsolute(p), `relative path (${p})`)
        assert(p.endsWith('.webp'), `webp encoded (${p})`)
        assert(fs.existsSync(path.resolve(ws, p)), `file exists (${p})`)
      }
    }
  ],
  [
    're-run is idempotent: same paths, no new files on disk',
    async () => {
      const d1 = analyzeLogin(ws)
      const before = walkFiles(ASSETS_DIR)
      const d2 = analyzeLogin(ws)
      assertEq(assetPathsOf(d2), assetPathsOf(d1), 'same asset paths')
      assertEq(walkFiles(ASSETS_DIR), before, 'disk file set unchanged')
    }
  ],
  [
    'cross-artboard dedup: referenced unique paths === files on disk',
    async () => {
      const lr = cli(['list', '-f', FIXTURE_ZIP], { cwd: ws })
      const list = parseJsonOutput(lr.stdout)
      const union = new Set()
      for (const a of list.artboards) {
        const r = cli(
          [
            'analyze',
            '-f',
            FIXTURE_ZIP,
            '--pn',
            a.pageName,
            '--an',
            a.artboardName
          ],
          { cwd: ws }
        )
        assert(r.status === 0, `analyze ${a.artboardName} exit ${r.status}`)
        for (const p of assetPathsOf(JSON.parse(r.stdout))) union.add(p)
      }
      const disk = walkFiles(ASSETS_DIR)
      const referenced = [...union]
        .map(p =>
          path.relative(ASSETS_DIR, path.resolve(ws, p)).replace(/\\/g, '/')
        )
        .sort()
      assertEq(
        referenced,
        disk,
        'every unique referenced asset exists exactly once on disk'
      )
      assert(
        disk.length > 10,
        `design-wide deduped asset count sanity (${disk.length})`
      )
    }
  ],
  [
    'assets-index.json persisted with workspace-relative paths',
    async () => {
      assert(fs.existsSync(INDEX), 'index file exists')
      const index = JSON.parse(fs.readFileSync(INDEX, 'utf8'))
      const scopes = Object.keys(index)
      assert(scopes.length >= 1, 'at least one assets scope')
      const paths = scopes.flatMap(s => Object.values(index[s]))
      assert(paths.length > 0, 'index has entries')
      for (const p of paths) {
        assert(!path.isAbsolute(p), `index path relative (${p})`)
        assert(fs.existsSync(path.resolve(ws, p)), `indexed file exists (${p})`)
      }
    }
  ],
  [
    'self-heal after full wipe (index + asset files)',
    async () => {
      fs.rmSync(ASSETS_DIR, { recursive: true, force: true })
      fs.rmSync(INDEX, { force: true })
      const d = analyzeLogin(ws)
      const paths = assetPathsOf(d)
      assert(paths.length > 0, 'assets re-exported')
      for (const p of paths) {
        assert(fs.existsSync(path.resolve(ws, p)), `re-created (${p})`)
      }
      assert(fs.existsSync(INDEX), 'index rebuilt')
    }
  ],
  [
    'self-heal when an indexed file is deleted (stale index entry)',
    async () => {
      const d = analyzeLogin(ws)
      const p = assetPathsOf(d)[0]
      const abs = path.resolve(ws, p)
      fs.rmSync(abs)
      const d2 = analyzeLogin(ws)
      const again = assetPathsOf(d2)
      assertEq(again, assetPathsOf(d), 'paths stable across re-export')
      assert(fs.existsSync(abs), 'missing file re-created via content compare')
    }
  ]
])
