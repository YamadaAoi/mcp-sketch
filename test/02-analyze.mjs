import fs from 'node:fs'
import path from 'node:path'
import {
  cli,
  parseJsonOutput,
  makeWorkspace,
  assert,
  assertEq,
  runSuite,
  hasSharp,
  COLS,
  FIXTURE_ZIP,
  PAGE,
  analyzeLogin
} from './helpers.mjs'

const ws = makeWorkspace('02-analyze')
let full = null

/** 与源码 filterSketchLayerByRect 同谓词：仅保留完全落入 rect 的层 */
function insideRect(row, rect) {
  const [x, y, w, h] = [row[3], row[4], row[5], row[6]]
  return (
    x >= rect[0] &&
    x < rect[0] + rect[2] &&
    y >= rect[1] &&
    y < rect[1] + rect[3] &&
    x + w > rect[0] &&
    x + w <= rect[0] + rect[2] &&
    y + h > rect[1] &&
    y + h <= rect[1] + rect[3]
  )
}

/** 与源码同谓词：完全被 exclude rect 包含的层剔除 */
function notExcluded(row, e) {
  const [x, y, w, h] = [row[3], row[4], row[5], row[6]]
  return !(
    x >= e[0] &&
    y >= e[1] &&
    x + w <= e[0] + e[2] &&
    y + h <= e[1] + e[3]
  )
}

await runSuite('02-analyze: positional format & filters', [
  [
    'positional invariants: columns, row width 10, slot types, metadata',
    async () => {
      full = analyzeLogin(ws)
      assertEq(full.columns, COLS, 'columns declaration')
      assertEq(full.pageName, PAGE, 'pageName')
      assertEq(full.name, '登录', 'artboard name')
      assert(
        typeof full.width === 'number' && typeof full.height === 'number',
        'width/height numbers'
      )
      assertEq(full.total, 15, 'total after filtering')
      assertEq(full.layers.length, 15, 'layer rows (no pagination)')

      const requiredKeys = [
        'pageName',
        'name',
        'width',
        'height',
        'total',
        'previewPath',
        'columns',
        'layers'
      ]
      for (const k of requiredKeys) assert(k in full, `metadata key ${k}`)
      for (const k of Object.keys(full)) {
        assert(
          requiredKeys.includes(k) || k === 'extras',
          `no unexpected key ${k}`
        )
      }

      const indices = new Set()
      for (const row of full.layers) {
        assertEq(row.length, COLS.length, `row width for layer ${row[1]}`)
        const [idx, name, type, x, y, w, h, content, css, assets] = row
        assert(typeof idx === 'number', `index number (${name})`)
        assert(!indices.has(idx), `index ${idx} unique`)
        indices.add(idx)
        assert(typeof name === 'string' && !!name, `name string (${name})`)
        assert(
          ['text', 'shape', 'slice'].includes(type),
          `type valid (${name}: ${type})`
        )
        for (const [label, n] of [
          ['x', x],
          ['y', y],
          ['w', w],
          ['h', h]
        ]) {
          assert(typeof n === 'number', `${label} number (${name})`)
        }
        assert(typeof content === 'string', `content typed empty "" (${name})`)
        assert(
          Array.isArray(css) && css.every(s => typeof s === 'string'),
          `css string[] (${name})`
        )
        assert(
          Array.isArray(assets) && assets.every(s => typeof s === 'string'),
          `assets string[] (${name})`
        )
      }

      assert(typeof full.previewPath === 'string', 'previewPath string')
      assert(
        !path.isAbsolute(full.previewPath),
        'previewPath relative to workspace'
      )
      assert(
        fs.existsSync(path.resolve(ws, full.previewPath)),
        'preview file exists on disk'
      )
    }
  ],
  [
    'type composition: 5 slice / 7 text / 3 shape; -t filter matches',
    async () => {
      const byType = {}
      for (const row of full.layers) byType[row[2]] = (byType[row[2]] ?? 0) + 1
      assertEq(byType.slice, 5, 'slice count')
      assertEq(byType.text, 7, 'text count')
      assertEq(byType.shape, 3, 'shape count')
      for (const t of ['text', 'shape', 'slice']) {
        const d = analyzeLogin(ws, ['-t', t])
        assertEq(d.total, byType[t], `-t ${t} total`)
        assert(
          d.layers.every(row => row[2] === t),
          `all rows are ${t}`
        )
      }
    }
  ],
  [
    'name filter -n: self-consistent with full rows, non-empty result',
    async () => {
      const kw = 'icon'
      const expected = full.layers.filter(r => r[1].toLowerCase().includes(kw))
      assert(expected.length > 0, 'keyword matches something in 登录')
      const d = analyzeLogin(ws, ['-n', kw])
      assertEq(d.total, expected.length, '-n total')
      assertEq(d.layers, expected, '-n rows equal full-set subset (order kept)')
    }
  ],
  [
    'pagination: --limit/--offset slice the ranked list, total stays 15',
    async () => {
      const l5 = analyzeLogin(ws, ['-l', '5'])
      assertEq(l5.layers.length, 5, 'limit 5 rows')
      assertEq(l5.total, 15, 'limit does not change total')

      const mid = analyzeLogin(ws, ['-l', '5', '-o', '5'])
      assertEq(mid.layers, full.layers.slice(5, 10), 'offset 5 limit 5')

      const tail = analyzeLogin(ws, ['-o', '14'])
      assertEq(tail.layers.length, 1, 'offset 14 → 1 row')
      assertEq(tail.total, 15, 'total unchanged')

      const past = analyzeLogin(ws, ['-o', '20'])
      assertEq(past.layers, [], 'offset beyond end → empty rows')
      assertEq(past.total, 15, 'total still reported')
    }
  ],
  [
    'rect filter: only fully-inside layers, order preserved, cropped preview',
    async () => {
      const rect = [0, 0, 960, 1080]
      const expected = full.layers.filter(r => insideRect(r, rect))
      assert(expected.length > 0 && expected.length < 15, 'rect selects a part')
      const d = analyzeLogin(ws, ['-r', JSON.stringify(rect)])
      assertEq(d.total, expected.length, 'rect total')
      assertEq(d.layers, expected, 'rect rows equal predicate subset')
      assert(
        typeof d.previewPath === 'string' &&
          fs.existsSync(path.resolve(ws, d.previewPath)),
        'cropped preview written'
      )
    }
  ],
  [
    'exclude rect: fully-contained layers dropped',
    async () => {
      const whole = [0, 0, 1920, 1080]
      const all = analyzeLogin(ws, ['-e', JSON.stringify([whole])])
      assertEq(all.total, 0, 'excluding whole artboard empties result')
      assertEq(all.layers, [], 'empty rows')

      const target = full.layers[0]
      const e = [target[3], target[4], target[5], target[6]]
      const expected = full.layers.filter(r => notExcluded(r, e))
      const d = analyzeLogin(ws, ['-e', JSON.stringify([e])])
      assertEq(d.layers, expected, 'exclude rect drops contained layers')
    }
  ],
  [
    'slice rows carry asset paths (webp when sharp available) existing on disk',
    async () => {
      const sharpOk = await hasSharp()
      const slices = full.layers.filter(r => r[2] === 'slice')
      assertEq(slices.length, 5, 'slice rows')
      for (const row of slices) {
        assert(row[9].length >= 1, `slice ${row[1]} has assets`)
        for (const p of row[9]) {
          assert(!path.isAbsolute(p), `asset path relative (${p})`)
          if (sharpOk) assert(p.endsWith('.webp'), `asset is webp (${p})`)
          assert(fs.existsSync(path.resolve(ws, p)), `asset file exists (${p})`)
        }
      }
    }
  ],
  [
    'all 10 artboards: analyze OK, row width 10, extras only opacity/rotation',
    async () => {
      const lr = cli(['list', '-f', FIXTURE_ZIP], { cwd: ws })
      const list = parseJsonOutput(lr.stdout)
      let artboardsWithExtras = 0
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
        assert(
          r.status === 0,
          `analyze ${a.artboardName} exit ${r.status}\n${r.stderr.slice(0, 400)}`
        )
        const d = JSON.parse(r.stdout)
        assert(d.total >= 1, `${a.artboardName} has layers`)
        for (const row of d.layers) {
          assertEq(row.length, COLS.length, `${a.artboardName} row width`)
        }
        if ('extras' in d) {
          artboardsWithExtras++
          const rowIndexes = new Set(d.layers.map(row => row[0]))
          for (const [idx, extra] of Object.entries(d.extras)) {
            assert(
              rowIndexes.has(Number(idx)),
              `extras key ${idx} is a row index (${a.artboardName})`
            )
            for (const k of Object.keys(extra)) {
              assert(
                k === 'opacity' || k === 'rotation',
                `extras field ${k} allowed (${a.artboardName})`
              )
              assert(typeof extra[k] === 'number', `extras.${k} number`)
            }
          }
        }
      }
      console.log(
        `        (info) artboards with extras: ${artboardsWithExtras}/10`
      )
    }
  ]
])
