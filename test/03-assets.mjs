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
  FIXTURE_NAME,
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
      /** path → Set("page|artboard|layer")，期望的名称溯源 */
      const expectedNames = {}
      for (const a of list.artboards) {
        const r = cli(
          [
            'analyze',
            '-f',
            FIXTURE_ZIP,
            '-p',
            a.pageName,
            '-a',
            a.artboardName
          ],
          { cwd: ws }
        )
        assert(r.status === 0, `analyze ${a.artboardName} exit ${r.status}`)
        const rows = JSON.parse(r.stdout).layers
        for (const row of rows) {
          for (const p of Array.isArray(row[9]) ? row[9] : []) {
            union.add(p)
            ;(expectedNames[p] ??= new Set()).add(
              `${a.pageName}|${a.artboardName}|${row[1]}`
            )
          }
        }
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

      // 名称溯源：索引 names 与全部画板引用精确一致（含跨画板去重的多来源）
      const index = JSON.parse(fs.readFileSync(INDEX, 'utf8'))
      assertEq(
        Object.keys(index.names).sort(),
        Object.keys(expectedNames).sort(),
        'names cover exactly the referenced paths'
      )
      for (const [p, set] of Object.entries(expectedNames)) {
        assertEq(
          [
            ...new Set(
              (index.names[p] ?? []).map(
                n => `${n.page}|${n.artboard}|${n.layer}`
              )
            )
          ].sort(),
          [...set].sort(),
          `origins for ${p}`
        )
      }
      assert(
        Object.values(expectedNames).some(s => s.size >= 2),
        'dedup: some asset serves multiple layer origins'
      )
    }
  ],
  [
    'assets-index.json v2: scoped dedup entries + name origins',
    async () => {
      assert(fs.existsSync(INDEX), 'index file exists')
      const index = JSON.parse(fs.readFileSync(INDEX, 'utf8'))
      assertEq(index.v, 2, 'index structure version')
      const scopes = Object.keys(index.scopes)
      assert(scopes.length >= 1, 'at least one assets scope')
      const paths = scopes.flatMap(s => Object.values(index.scopes[s]))
      assert(paths.length > 0, 'index has entries')
      for (const p of paths) {
        assert(!path.isAbsolute(p), `index path relative (${p})`)
        assert(fs.existsSync(path.resolve(ws, p)), `indexed file exists (${p})`)
      }
      const nameKeys = Object.keys(index.names)
      assert(nameKeys.length > 0, 'name origins recorded')
      for (const k of nameKeys) {
        assert(
          Array.isArray(index.names[k]) && index.names[k].length > 0,
          `origin list for ${k}`
        )
        for (const n of index.names[k]) {
          assertEq(
            Object.keys(n).sort(),
            ['artboard', 'layer', 'name', 'page'],
            'origin fields'
          )
          assert(
            typeof n.name === 'string' && /\.[a-z0-9]+$/i.test(n.name),
            `original file name with extension for ${k} (${n.name})`
          )
        }
      }
      // 拼音 → 原始文件名的具体事实：bian-zu-7.webp ← 编组 7.png
      const bgKey = nameKeys.find(k => k.endsWith('bian-zu-7.webp'))
      assert(
        index.names[bgKey]?.some(
          n => n.name === '编组 7.png' && n.layer === '编组 7'
        ),
        'pinyin filename maps to original export file name'
      )
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
  ],
  [
    'legacy index (no v/names) migrates to v2: scopes kept, names rebuilt',
    async () => {
      const current = JSON.parse(fs.readFileSync(INDEX, 'utf8'))
      fs.writeFileSync(INDEX, JSON.stringify(current.scopes, null, 2))

      // 清 analyze 落盘缓存，强制走重算路径重新登记名称溯源
      fs.rmSync(path.join(ws, '.sketch-cache', FIXTURE_NAME, 'analyze'), {
        recursive: true,
        force: true
      })
      const d = analyzeLogin(ws)
      const migrated = JSON.parse(fs.readFileSync(INDEX, 'utf8'))
      assertEq(migrated.v, 2, 'migrated to v2')
      assertEq(migrated.scopes, current.scopes, 'legacy scopes preserved')
      assert(
        Object.keys(migrated.names).length > 0,
        'names rebuilt on recompute'
      )
      for (const p of assetPathsOf(d)) {
        assert(
          migrated.names[p]?.some(
            n => n.artboard === '登录' && /\.[a-z0-9]+$/i.test(n.name ?? '')
          ),
          `origin with original file name recorded for ${p}`
        )
      }
    }
  ]
])
