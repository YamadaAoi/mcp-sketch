import fs from 'node:fs'
import path from 'node:path'
import {
  cli,
  makeWorkspace,
  walkFiles,
  assert,
  assertEq,
  runSuite,
  FIXTURE_ZIP,
  FIXTURE_NAME,
  PAGE,
  analyzeLogin
} from './helpers.mjs'

const ws = makeWorkspace('09-analyze-cache')
const CACHE_DIR = path.join(ws, '.sketch-cache', FIXTURE_NAME, 'analyze')

const cacheFiles = () => walkFiles(CACHE_DIR)
const cachePath = f => path.join(CACHE_DIR, f)
const readCache = f => JSON.parse(fs.readFileSync(cachePath(f), 'utf8'))
const writeCache = (f, entry) =>
  fs.writeFileSync(cachePath(f), JSON.stringify(entry, null, 2), 'utf8')

await runSuite('09-analyze-cache: param-keyed result cache on disk', [
  [
    'first run writes one param-keyed cache file; re-run serves identical output',
    async () => {
      const r1 = analyzeLogin(ws)
      const files = cacheFiles()
      assertEq(files.length, 1, 'exactly one cache file after first run')
      const name = files[0]
      assert(name.endsWith('.json'), 'json file')
      assert(name.includes('--登录--'), 'filename carries artboard name')
      assert(name.includes('--all--'), 'no-param entry marked all')

      const entry = readCache(name)
      assertEq(entry.v, 1, 'cache structure version')
      assert(typeof entry.stamp === 'number', 'stamp present')
      assertEq(entry.response.total, 15, 'cached response holds full result')

      const r2 = analyzeLogin(ws)
      assertEq(r2, r1, 'cache hit returns byte-identical output')
    }
  ],
  [
    'hit served from disk (sentinel mutation) ; corrupt cache regenerates',
    async () => {
      const name = cacheFiles()[0]
      const entry = readCache(name)
      entry.response.total = 999
      writeCache(name, entry)
      assertEq(analyzeLogin(ws).total, 999, 'mutated cache served as-is')

      fs.writeFileSync(cachePath(name), '{ not json')
      const r = analyzeLogin(ws)
      assertEq(r.total, 15, 'corrupt cache regenerates')
      assertEq(readCache(cacheFiles()[0]).response.total, 15, 'cache rewritten')
    }
  ],
  [
    'different params → distinct cache files with readable param segments',
    async () => {
      const before = cacheFiles().length
      analyzeLogin(ws, ['-r', JSON.stringify([695, 200, 530, 660])])
      analyzeLogin(ws, ['-t', 'text'])
      analyzeLogin(ws, ['-l', '5'])
      analyzeLogin(ws, ['-n', 'icon'])
      analyzeLogin(ws, ['-e', JSON.stringify([[0, 0, 1, 1]])])
      analyzeLogin(ws, [
        '-e',
        JSON.stringify([
          [0, 0, 1, 1],
          [10, 10, 20, 20]
        ])
      ])
      analyzeLogin(ws, [
        '-e',
        JSON.stringify(
          Array.from({ length: 12 }, (_, i) => [i * 10, i * 10, 5, 5])
        )
      ])
      // exclude_rects 不进文件名（数量不可控）：各变体可读段相同（all），靠 hash 各自成文件
      const longExclude = off =>
        JSON.stringify(
          Array.from({ length: 40 }, (_, i) => [off + i * 10, i * 10, 5, 5])
        )
      analyzeLogin(ws, ['-e', longExclude(0)])
      analyzeLogin(ws, ['-e', longExclude(500)])
      const files = cacheFiles()
      assertEq(files.length, before + 9, 'one file per param combination')
      assert(
        files.some(f => f.includes('r695_200_530_660')),
        'rect in filename'
      )
      assert(
        files.some(f => f.includes('ttext')),
        'type in filename'
      )
      assert(
        files.some(f => f.includes('l5')),
        'limit in filename'
      )
      assert(
        files.some(f => f.includes('nicon')),
        'name in filename'
      )
      assert(
        !files.some(f => f.includes('~')),
        'exclude rects absent from filenames'
      )
      const allFiles = files.filter(f => f.includes('--all--'))
      assertEq(
        allFiles.length,
        6,
        'no-param call + 5 exclude variants share the all readable segment'
      )
      assert(
        files.every(f => f.length < 200),
        'filename length bounded (Windows filename limits)'
      )
      assert(
        files.every(f => f.includes('--登录--')),
        'all entries carry artboard segment'
      )

      // 完整参数键记录在缓存文件内容里（文件名不含 exclude_rects）
      assertEq(
        allFiles.filter(f => readCache(f).key.exclude_rects?.length === 12)
          .length,
        1,
        '12-exclude key stored inside its cache file'
      )
      assertEq(
        allFiles.filter(f => readCache(f).key.exclude_rects?.length === 40)
          .length,
        2,
        '40-exclude keys stored inside two distinct cache files'
      )

      const t = analyzeLogin(ws, ['-t', 'text'])
      assert(
        t.layers.every(r => r[2] === 'text'),
        'type filter still applied on its own cache entry'
      )
    }
  ],
  [
    'design update (mtime stamp) invalidates cache and rewrites it',
    async () => {
      const ws2 = makeWorkspace('09-analyze-cache-stamp')
      const zipCopy = path.join(ws2, 'design.zip')
      fs.copyFileSync(FIXTURE_ZIP, zipCopy)
      const run = () =>
        cli(['analyze', '-f', zipCopy, '-p', PAGE, '-a', '登录'], {
          cwd: ws2
        })

      const r1 = JSON.parse(run().stdout)
      assertEq(r1.total, 15, 'analyze on copied design')

      const dir = path.join(ws2, '.sketch-cache', 'design', 'analyze')
      const f0 = walkFiles(dir)[0]
      const entry = JSON.parse(fs.readFileSync(path.join(dir, f0), 'utf8'))
      entry.response.total = 999
      fs.writeFileSync(path.join(dir, f0), JSON.stringify(entry, null, 2))
      assertEq(
        JSON.parse(run().stdout).total,
        999,
        'cache hit before update serves sentinel'
      )

      const t = new Date(Date.now() + 10000)
      fs.utimesSync(zipCopy, t, t)
      const r2 = JSON.parse(run().stdout)
      assertEq(r2.total, 15, 'stamp mismatch forces recompute')

      const entry2 = JSON.parse(
        fs.readFileSync(path.join(dir, walkFiles(dir)[0]), 'utf8')
      )
      assertEq(
        entry2.stamp,
        fs.statSync(zipCopy).mtimeMs,
        'cache rewritten with new stamp'
      )
    }
  ],
  [
    'deleted referenced asset bypasses cache and self-heals',
    async () => {
      const r1 = analyzeLogin(ws)
      const row = r1.layers.find(l => Array.isArray(l[9]) && l[9].length)
      assert(!!row, 'fixture exports assets')
      const abs = path.resolve(ws, row[9][0])
      fs.rmSync(abs)

      const r2 = analyzeLogin(ws)
      assert(fs.existsSync(abs), 'deleted asset re-created (cache bypassed)')
      assertEq(r2, r1, 'output identical after heal')
    }
  ],
  [
    'deleted preview bypasses cache and regenerates',
    async () => {
      const r1 = analyzeLogin(ws)
      const abs = path.resolve(ws, r1.previewPath)
      fs.rmSync(abs)

      const r2 = analyzeLogin(ws)
      assert(fs.existsSync(abs), 'preview re-created (cache bypassed)')
      assertEq(r2, r1, 'output identical after regeneration')
    }
  ],
  [
    'ASSETS_PATH change gets its own cache entry',
    async () => {
      const before = cacheFiles().length
      const r = cli(['analyze', '-f', FIXTURE_ZIP, '-p', PAGE, '-a', '登录'], {
        cwd: ws,
        env: { ASSETS_PATH: 'alt-assets' }
      })
      assert(r.status === 0, `exit ${r.status}\n${r.stderr.slice(0, 500)}`)
      const d = JSON.parse(r.stdout)
      assertEq(d.total, 15, 'alt assets run succeeds')
      assertEq(cacheFiles().length, before + 1, 'separate cache file')
      assert(
        fs.existsSync(path.join(ws, 'alt-assets')),
        'assets written to alt dir'
      )
    }
  ]
])
