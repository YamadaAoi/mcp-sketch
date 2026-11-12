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
  ]
])
