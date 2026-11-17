import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  cli,
  makeWorkspace,
  assert,
  assertEq,
  runSuite,
  hasSharp,
  FIXTURE_ZIP,
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

function runCompare(basePath, shotPath, extra = []) {
  return cli(['compare', '-b', basePath, '-s', shotPath, ...extra], { cwd: ws })
}

await runSuite('04-compare: two-image diff (base vs screenshot)', [
  [
    'identical screenshot scores 1.0, diff image written next to the base',
    async () => {
      const d = analyzeLogin(ws)
      previewAbs = path.resolve(ws, d.previewPath)
      const shot = path.join(ws, 'shot-identical.png')
      fs.copyFileSync(previewAbs, shot)

      const r = runCompare(previewAbs, shot)
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
        `diff stored as compare/<timestamp>.webp next to the base (got ${out.diffPath})`
      )
      assert(
        fs.existsSync(path.resolve(ws, out.diffPath)),
        'diff image written'
      )
      assertEq(
        out.base,
        path.relative(ws, previewAbs),
        'base path echoed in output'
      )
      assert(
        out.baseSize.width > 0 && out.comparedRegion.width > 0,
        'image metadata present'
      )
    }
  ],
  [
    'region param removed: -r rejected as unknown option',
    async () => {
      const r = runCompare(previewAbs, path.join(ws, 'shot-identical.png'), [
        '-r',
        '[16, 12, 320, 200]'
      ])
      assert(r.status === 1, `exit ${r.status}`)
      assert(
        (r.stderr + r.stdout).includes('unknown option'),
        'unknown-option error message'
      )
    }
  ],
  [
    'design-stack params removed: -f rejected as unknown option',
    async () => {
      const r = cli(
        [
          'compare',
          '-f',
          FIXTURE_ZIP,
          '-b',
          previewAbs,
          '-s',
          path.join(ws, 'shot-identical.png')
        ],
        { cwd: ws }
      )
      assert(r.status === 1, `exit ${r.status}`)
      assert(
        (r.stderr + r.stdout).includes('unknown option'),
        'unknown-option error message'
      )
    }
  ],
  [
    'different screenshot scores below 1, region aligned to base width',
    async () => {
      const shot = path.join(ws, 'shot-red.png')
      await sharp({
        create: { width: 400, height: 300, channels: 3, background: '#ff0000' }
      })
        .png()
        .toFile(shot)

      const r = runCompare(previewAbs, shot)
      assert(r.status === 0, `exit ${r.status}`)
      const out = JSON.parse(r.stdout)
      assert(out.score < 0.99, `score < 0.99 (got ${out.score})`)
      assert(out.score > 0, 'score positive')
      assertEq(
        out.comparedRegion.width,
        out.baseSize.width,
        'screenshot resized to base width before compare'
      )
    }
  ],
  [
    'wider screenshot downscales to base width before compare',
    async () => {
      const shot = path.join(ws, 'shot-wide.png')
      await sharp({
        create: { width: 3840, height: 800, channels: 3, background: '#00ff00' }
      })
        .png()
        .toFile(shot)

      const r = runCompare(previewAbs, shot)
      assert(r.status === 0, `exit ${r.status}\n${r.stderr.slice(0, 800)}`)
      const out = JSON.parse(r.stdout)
      assert(
        out.baseSize.width < 3840,
        `base narrower than the wide shot (got ${out.baseSize.width})`
      )
      assertEq(
        out.comparedRegion.width,
        out.baseSize.width,
        'wide screenshot downscaled to base width'
      )
      assert(out.score < 0.99, `score < 0.99 (got ${out.score})`)
    }
  ],
  [
    'diff images accumulate in the base image compare/ folder',
    async () => {
      const compareDir = path.join(path.dirname(previewAbs), 'compare')
      const before = fs.existsSync(compareDir)
        ? fs.readdirSync(compareDir).length
        : 0
      assert(before >= 1, 'earlier comparisons already wrote diffs')

      const r = runCompare(previewAbs, path.join(ws, 'shot-red.png'))
      assert(r.status === 0, `exit ${r.status}`)
      const files = fs
        .readdirSync(compareDir)
        .filter(f => /^\d+\.webp$/.test(f))
      assertEq(files.length, before + 1, 'one new timestamped diff per run')
    }
  ],
  [
    'diff archive follows the base image: a custom dir gets its own compare/',
    async () => {
      const customDir = path.join(ws, 'custom')
      fs.mkdirSync(customDir, { recursive: true })
      const base = path.join(customDir, 'base.png')
      fs.copyFileSync(previewAbs, base)

      const r = runCompare(base, path.join(ws, 'shot-red.png'))
      assert(r.status === 0, `exit ${r.status}\n${r.stderr.slice(0, 800)}`)
      const out = JSON.parse(r.stdout)
      assertEq(
        out.diffPath.replace(/\\/g, '/'),
        `custom/compare/${path.basename(out.diffPath)}`,
        'diff written to compare/ next to the custom base'
      )
      assert(
        /^\d+\.webp$/.test(path.basename(out.diffPath)),
        'timestamped webp filename'
      )
      assert(
        fs.existsSync(path.resolve(ws, out.diffPath)),
        'diff image written'
      )
    }
  ],
  [
    'missing screenshot file → exit 1 with friendly error',
    async () => {
      const r = runCompare(previewAbs, path.join(ws, 'nope.png'))
      assert(r.status === 1, `exit ${r.status}`)
      assert(
        (r.stderr + r.stdout).includes('screenshot image not found'),
        'friendly not-found error'
      )
    }
  ],
  [
    'missing base file → exit 1 with friendly error',
    async () => {
      const r = runCompare(
        path.join(ws, 'nope-base.png'),
        path.join(ws, 'shot-red.png')
      )
      assert(r.status === 1, `exit ${r.status}`)
      assert(
        (r.stderr + r.stdout).includes('base image not found'),
        'friendly not-found error'
      )
    }
  ],
  [
    'invalid base image (not an image) → exit 1',
    async () => {
      const fake = path.join(ws, 'not-an-image.png')
      fs.writeFileSync(fake, 'this is not an image')
      const r = runCompare(fake, path.join(ws, 'shot-red.png'))
      assert(r.status === 1, `exit ${r.status}`)
      assert(
        (r.stderr + r.stdout).includes('invalid base image'),
        'invalid-image error'
      )
    }
  ],
  [
    'base path is a directory → exit 1 with not-readable error',
    async () => {
      const r = runCompare(ws, path.join(ws, 'shot-red.png'))
      assert(r.status === 1, `exit ${r.status}`)
      assert(
        (r.stderr + r.stdout).includes('base image not readable'),
        'not-readable error (distinguished from not-found)'
      )
    }
  ],
  [
    'cross-drive base image → absolute echo paths, diff written next to base',
    async () => {
      // 优先使用 opencode 临时目录（环境约定），不存在时退回系统临时目录
      const tmpBase = fs.existsSync(path.join(os.tmpdir(), 'opencode'))
        ? path.join(os.tmpdir(), 'opencode')
        : os.tmpdir()
      if (path.parse(tmpBase).root === path.parse(ws).root) {
        console.log('        (info) single-drive environment, case skipped')
        return
      }
      const dir = await fs.promises.mkdtemp(path.join(tmpBase, 'mcp-sketch-'))
      try {
        const base = path.join(dir, 'base.png')
        fs.copyFileSync(previewAbs, base)
        const r = runCompare(base, path.join(ws, 'shot-red.png'))
        assert(r.status === 0, `exit ${r.status}\n${r.stderr.slice(0, 800)}`)
        const out = JSON.parse(r.stdout)
        assertEq(out.base, base, 'base echoed as the given absolute path')
        assert(
          path.isAbsolute(out.diffPath),
          'diffPath absolute when no relative path exists'
        )
        assertEq(
          path.dirname(out.diffPath),
          path.join(dir, 'compare'),
          'diff archived next to the cross-drive base'
        )
        assert(fs.existsSync(out.diffPath), 'diff image written')
      } finally {
        await fs.promises.rm(dir, { recursive: true, force: true })
      }
    }
  ]
])
