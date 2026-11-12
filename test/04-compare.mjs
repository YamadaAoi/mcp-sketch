import fs from 'node:fs'
import path from 'node:path'
import {
  cli,
  makeWorkspace,
  assert,
  assertEq,
  runSuite,
  hasSharp,
  FIXTURE_ZIP,
  PAGE,
  analyzeLogin
} from './helpers.mjs'

const sharpOk = await hasSharp()
if (!sharpOk) {
  console.log('\n=== 04-compare ===')
  console.log('  SKIP  sharp not available in this environment')
  process.exit(0)
}
const sharp = (await import('sharp')).default

const ws = makeWorkspace('04-compare')
let previewAbs = ''

function runCompare(shotPath, extra = []) {
  return cli(
    [
      'compare',
      '-f',
      FIXTURE_ZIP,
      '--pn',
      PAGE,
      '--an',
      '登录',
      '-s',
      shotPath,
      ...extra
    ],
    { cwd: ws }
  )
}

await runSuite('04-compare: screenshot vs preview similarity', [
  [
    'identical screenshot scores 1.0, diff image written',
    async () => {
      const d = analyzeLogin(ws)
      previewAbs = path.resolve(ws, d.previewPath)
      const shot = path.join(ws, 'shot-identical.png')
      fs.copyFileSync(previewAbs, shot)

      const r = runCompare(shot)
      assert(r.status === 0, `exit ${r.status}\n${r.stderr.slice(0, 800)}`)
      const out = JSON.parse(r.stdout)
      assertEq(out.score, 1, 'score of identical image')
      assertEq(out.similarity, '100.00%', 'similarity label')
      assert(typeof out.diffPath === 'string', 'diffPath string')
      assert(!path.isAbsolute(out.diffPath), 'diffPath relative')
      assert(
        /^\.sketch-cache[/\\].+[/\\]compare[/\\]\d+\.webp$/.test(
          out.diffPath.replace(/\\/g, '/')
        ),
        `diff stored as compare/<timestamp>.webp (got ${out.diffPath})`
      )
      assert(
        fs.existsSync(path.resolve(ws, out.diffPath)),
        'diff image written'
      )
      assert(
        out.preview.width > 0 && out.comparedRegion.width > 0,
        'image metadata present'
      )
    }
  ],
  [
    'different screenshot scores below 1, region aligned to preview width',
    async () => {
      const shot = path.join(ws, 'shot-red.png')
      await sharp({
        create: { width: 400, height: 300, channels: 3, background: '#ff0000' }
      })
        .png()
        .toFile(shot)

      const r = runCompare(shot)
      assert(r.status === 0, `exit ${r.status}`)
      const out = JSON.parse(r.stdout)
      assert(out.score < 0.99, `score < 0.99 (got ${out.score})`)
      assert(out.score > 0, 'score positive')
      assertEq(
        out.comparedRegion.width,
        out.preview.width,
        'screenshot resized to preview width before compare'
      )
    }
  ],
  [
    'diff images accumulate in the artboard compare/ folder',
    async () => {
      const artboardCache = path.join(
        ws,
        '.sketch-cache',
        '电磁信号保密监测器html',
        PAGE,
        '登录'
      )
      const compareDir = path.join(artboardCache, 'compare')
      const before = fs.existsSync(compareDir)
        ? fs.readdirSync(compareDir).length
        : 0
      assert(before >= 1, 'earlier comparisons already wrote diffs')

      const r = runCompare(path.join(ws, 'shot-red.png'))
      assert(r.status === 0, `exit ${r.status}`)
      const files = fs
        .readdirSync(compareDir)
        .filter(f => /^\d+\.webp$/.test(f))
      assertEq(files.length, before + 1, 'one new timestamped diff per run')
      assert(
        fs.readdirSync(compareDir).every(f => !f.startsWith('compare_')),
        'no legacy compare_*.webp filenames at artboard root level'
      )
    }
  ],
  [
    'missing screenshot file → exit 1',
    async () => {
      const r = runCompare(path.join(ws, 'nope.png'))
      assert(r.status === 1, `exit ${r.status}`)
      assert((r.stderr + r.stdout).trim().length > 0, 'error message printed')
    }
  ],
  [
    'nonexistent artboard → exit 1 with not-found hint',
    async () => {
      const r = cli(
        [
          'compare',
          '-f',
          FIXTURE_ZIP,
          '--pn',
          PAGE,
          '--an',
          '不存在的画板',
          '-s',
          path.join(ws, 'shot-red.png')
        ],
        { cwd: ws }
      )
      assert(r.status === 1, `exit ${r.status}`)
      assert(
        (r.stderr + r.stdout).includes('not found'),
        'error mentions not found'
      )
    }
  ]
])
