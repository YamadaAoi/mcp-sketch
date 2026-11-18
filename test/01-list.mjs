import fs from 'node:fs'
import path from 'node:path'
import {
  cli,
  parseJsonOutput,
  makeWorkspace,
  assert,
  assertEq,
  runSuite,
  FIXTURE_ZIP,
  FIXTURE_NAME
} from './helpers.mjs'

const ws = makeWorkspace('01-list')
const listPath = path.join(ws, '.sketch-cache', FIXTURE_NAME, 'list.json')

function runList() {
  return cli(['list', '-f', FIXTURE_ZIP], { cwd: ws })
}

let firstStdout = ''
let fresh = null

await runSuite('01-list: artboard overview & list.json cache', [
  [
    'fresh run: 10 artboards (keyed schema), tokens, preview files, list.json written',
    async () => {
      const r = runList()
      assert(r.status === 0, `exit ${r.status}\n${r.stderr.slice(0, 800)}`)
      assert(
        r.stdout.includes(`saved to ${listPath}`),
        'stdout mentions list.json path'
      )
      firstStdout = r.stdout
      fresh = parseJsonOutput(r.stdout, 'list output')

      assertEq(fresh.artboards.length, 10, 'artboards count')
      for (const a of fresh.artboards) {
        assertEq(
          Object.keys(a).sort(),
          ['artboardName', 'pageName', 'previewPath', 'size'],
          `artboard keys for ${a.artboardName}`
        )
        assert(
          typeof a.size === 'number' && a.size > 0,
          `size > 0 for ${a.artboardName}`
        )
        assert(
          typeof a.previewPath === 'string' && !!a.previewPath,
          `previewPath set for ${a.artboardName}`
        )
        assert(
          !path.isAbsolute(a.previewPath),
          `previewPath is relative for ${a.artboardName}`
        )
        assert(
          fs.existsSync(path.resolve(ws, a.previewPath)),
          `preview file exists on disk for ${a.artboardName}`
        )
      }

      assertEq(
        Object.keys(fresh.tokens).sort(),
        [
          'colors',
          'fontFamilies',
          'fontSizes',
          'radii',
          'shadows',
          'styleNames'
        ],
        'tokens keys'
      )
      assert(
        Object.keys(fresh.tokens.colors).length > 0,
        'tokens.colors non-empty'
      )
      assert(
        Object.keys(fresh.tokens.fontSizes).length > 0,
        'tokens.fontSizes non-empty'
      )
      const styleNames = Object.entries(fresh.tokens.styleNames)
      assert(
        styleNames.length > 0 && styleNames.length <= 20,
        'styleNames has 1..20 entries'
      )
      for (const [name, v] of styleNames) {
        assertEq(
          Object.keys(v).sort(),
          ['count', 'css'],
          `styleName entry shape for ${name}`
        )
        assert(Array.isArray(v.css) && v.css.length > 0, 'styleName has css')
      }

      const disk = JSON.parse(fs.readFileSync(listPath, 'utf8'))
      assertEq(disk, fresh, 'list.json on disk equals returned data')
    }
  ],
  [
    'duplicate artboard names kept: 用户管理 x2, 9 unique names',
    async () => {
      const names = fresh.artboards.map(a => a.artboardName)
      assertEq(new Set(names).size, 9, 'unique artboard names')
      assertEq(
        names.filter(n => n === '用户管理').length,
        2,
        '用户管理 appears twice'
      )
    }
  ],
  [
    'tokens.colors holds color values only (border shorthand normalized)',
    async () => {
      const colors = Object.keys(fresh.tokens.colors)
      assert(colors.length > 0, 'colors non-empty')
      for (const c of colors) {
        assert(
          /^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/i.test(c),
          `color-like key expected, got ${JSON.stringify(c)}`
        )
      }
      // fixture 事实：设计稿大量使用 border: 1px solid #C8CBCD（126 处），
      // 归一后应以纯色值入板，而非 "1px solid #C8CBCD" 整串
      assert('#C8CBCD' in fresh.tokens.colors, 'border color atom extracted')
      assert(
        !colors.some(c => c.includes('solid')),
        'no border shorthand values leaked into colors'
      )
    }
  ],
  [
    'tokens.styleNames css is noise-filtered (same measure as layer output)',
    async () => {
      const isNoise = d => {
        const s = d.trim().replace(/;$/, '').toLowerCase()
        return (
          s === 'letter-spacing: 0' ||
          s === 'font-weight: 400' ||
          s === 'line-height: normal' ||
          s === 'text-align: left'
        )
      }
      for (const [name, v] of Object.entries(fresh.tokens.styleNames)) {
        assert(v.css.length > 0, `styleName ${name} keeps representative css`)
        for (const d of v.css) {
          assert(!isNoise(d), `noise ${JSON.stringify(d)} in styleName ${name}`)
        }
      }
    }
  ],
  [
    'cache hit: identical output, list.json untouched',
    async () => {
      const before = fs.statSync(listPath).mtimeMs
      const r = runList()
      assert(r.status === 0, `exit ${r.status}`)
      assertEq(r.stdout, firstStdout, 'second run output identical')
      assertEq(
        fs.statSync(listPath).mtimeMs,
        before,
        'list.json mtime unchanged (no rewrite)'
      )
    }
  ],
  [
    'stale design: newer zip mtime forces regeneration (sentinel replaced)',
    async () => {
      // 用副本操作，避免改动共享 fixture 的 mtime
      const designCopy = path.join(ws, 'design-copy.zip')
      fs.copyFileSync(FIXTURE_ZIP, designCopy)
      const copyListPath = path.join(
        ws,
        '.sketch-cache',
        'design-copy',
        'list.json'
      )
      const warm = cli(['list', '-f', designCopy], { cwd: ws })
      assert(warm.status === 0, `warm-up list exit ${warm.status}`)

      fs.writeFileSync(copyListPath, '{ broken sentinel')
      const garbageMtime = fs.statSync(copyListPath).mtimeMs
      const bumped = new Date(Date.now() + 5000)
      fs.utimesSync(designCopy, bumped, bumped)

      const r = cli(['list', '-f', designCopy], { cwd: ws })
      assert(r.status === 0, `exit ${r.status}\n${r.stderr.slice(0, 400)}`)
      const data = parseJsonOutput(r.stdout)
      assertEq(data.artboards.length, 10, 'regenerated artboards')
      assert(
        fs.statSync(copyListPath).mtimeMs > garbageMtime,
        'list.json rewritten after design updated'
      )
    }
  ],
  [
    'corrupt list.json (unparseable) regenerates',
    async () => {
      fs.writeFileSync(listPath, 'not json at all')
      const r = runList()
      assert(r.status === 0, `exit ${r.status}\n${r.stderr.slice(0, 400)}`)
      const data = parseJsonOutput(r.stdout)
      assertEq(data.artboards.length, 10, 'artboards recovered')
      assert(!!data.tokens, 'tokens recovered')
    }
  ],
  [
    'legacy list.json (missing tokens field) regenerates',
    async () => {
      fs.writeFileSync(
        listPath,
        JSON.stringify({
          artboards: [{ pageName: 'x', artboardName: 'y', size: 1 }]
        })
      )
      const r = runList()
      assert(r.status === 0, `exit ${r.status}`)
      const disk = JSON.parse(fs.readFileSync(listPath, 'utf8'))
      assertEq(disk.artboards.length, 10, 'legacy cache replaced')
      assert(!!disk.tokens, 'tokens present after regeneration')
    }
  ],
  [
    'unversioned list.json (old tool output, e.g. border in colors) regenerates',
    async () => {
      // 旧版工具的 tokens 摘选会把 border 简写整串塞进 colors；无 v 字段的缓存
      // 不能在工具升级后继续沿用，必须按新逻辑重建
      fs.writeFileSync(
        listPath,
        JSON.stringify({
          artboards: [{ pageName: 'x', artboardName: 'y', size: 1 }],
          tokens: { colors: { '1px solid #C8CBCD': 160 } }
        })
      )
      const r = runList()
      assert(r.status === 0, `exit ${r.status}`)
      const disk = JSON.parse(fs.readFileSync(listPath, 'utf8'))
      assertEq(disk.v, 2, 'version stamp written')
      assertEq(disk.artboards.length, 10, 'unversioned cache replaced')
      assert(
        !Object.keys(disk.tokens.colors).some(c => /solid|border|px/i.test(c)),
        'border shorthand from stale cache not carried over'
      )
    }
  ],
  [
    'sliceBoard flag: threshold via SLICE_BOARD_RATIO (default 0.9 → none, 0.3 → two flagged)',
    async () => {
      const ws2 = makeWorkspace('01-list-slice')
      const run = env =>
        cli(['list', '-f', FIXTURE_ZIP], { cwd: ws2, ...(env ? { env } : {}) })

      // 默认阈值 0.9：fixture 切图占比最高 0.33（登录），无标记、字段不出现
      const d1 = parseJsonOutput(run().stdout, 'default threshold run')
      assert(
        d1.artboards.every(a => !('sliceBoard' in a)),
        'default threshold 0.9 flags nothing'
      )

      // 阈值 0.3：登录 5/15≈0.33 与 设备管理-证书升级 23/76≈0.30 被标记，其余不标
      const r2 = run({ SLICE_BOARD_RATIO: '0.3' })
      assert(r2.status === 0, `exit ${r2.status}`)
      const d2 = parseJsonOutput(r2.stdout, 'threshold 0.3 run')
      const flagged = [
        ...new Set(
          d2.artboards
            .filter(a => a.sliceBoard === true)
            .map(a => a.artboardName)
        )
      ]
      assertEq(flagged, ['登录', '设备管理-证书升级'], 'flagged set at 0.3')

      // 生效阈值写入 list.json；改阈值使缓存失效重算，同阈值复跑命中缓存
      const diskPath = path.join(
        ws2,
        '.sketch-cache',
        FIXTURE_NAME,
        'list.json'
      )
      assertEq(
        JSON.parse(fs.readFileSync(diskPath, 'utf8')).sliceBoardRatio,
        0.3,
        'effective threshold recorded in list.json'
      )
      const r3 = run({ SLICE_BOARD_RATIO: '0.3' })
      assertEq(
        parseJsonOutput(r3.stdout, 'same threshold re-run').artboards,
        d2.artboards,
        'same threshold re-run serves identical artboards'
      )
    }
  ]
])
