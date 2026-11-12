import fs from 'node:fs'
import path from 'node:path'
import {
  cli,
  parseJsonOutput,
  makeWorkspace,
  extractZip,
  assert,
  assertEq,
  runSuite,
  FIXTURE_ZIP,
  FIXTURE_NAME,
  PAGE
} from './helpers.mjs'

const ws = makeWorkspace('05-folder')
const wrappedDesign = path.join(ws, 'wrapped', FIXTURE_NAME)
const flatDesign = path.join(ws, 'flat')

await extractZip(FIXTURE_ZIP, path.join(ws, 'wrapped')) // 含 __MACOSX junk
await extractZip(FIXTURE_ZIP, flatDesign, {
  stripPrefix: `${FIXTURE_NAME}/`
}) // 摘掉外层目录 → flat 布局

/** previewPath 首段是设计缓存目录名（zip 名 / 目录名），归一后才能跨模式比对 */
function stripCachePrefix(p) {
  return p.replace(/^\.sketch-cache[/\\][^/\\]+[/\\]/, '')
}

function artboardFingerprint(list) {
  return list.artboards.map(a => ({
    pageName: a.pageName,
    artboardName: a.artboardName,
    size: a.size,
    previewPath: stripCachePrefix(a.previewPath)
  }))
}

await runSuite('05-folder: design folder input (wrapped & flat)', [
  [
    'wrapped layout (with __MACOSX junk): list + analyze work',
    async () => {
      const r = cli(['list', '-f', wrappedDesign], { cwd: ws })
      assert(r.status === 0, `exit ${r.status}\n${r.stderr.slice(0, 800)}`)
      const data = parseJsonOutput(r.stdout)
      assertEq(data.artboards.length, 10, 'wrapped folder artboards')

      const a = cli(
        ['analyze', '-f', wrappedDesign, '--pn', PAGE, '--an', '登录'],
        { cwd: ws }
      )
      assert(a.status === 0, `analyze exit ${a.status}`)
      assertEq(JSON.parse(a.stdout).total, 15, 'wrapped 登录 total')
    }
  ],
  [
    'flat layout (no wrapper dir): list + analyze work',
    async () => {
      const r = cli(['list', '-f', flatDesign], { cwd: ws })
      assert(r.status === 0, `exit ${r.status}\n${r.stderr.slice(0, 800)}`)
      const data = parseJsonOutput(r.stdout)
      assertEq(data.artboards.length, 10, 'flat folder artboards')

      const a = cli(
        ['analyze', '-f', flatDesign, '--pn', PAGE, '--an', '登录'],
        { cwd: ws }
      )
      assert(a.status === 0, `analyze exit ${a.status}`)
      assertEq(JSON.parse(a.stdout).total, 15, 'flat 登录 total')
    }
  ],
  [
    'zip / wrapped / flat parity: same artboards, sizes and preview tails',
    async () => {
      const zipWs = makeWorkspace('05-folder-zip')
      const zr = cli(['list', '-f', FIXTURE_ZIP], { cwd: zipWs })
      assert(zr.status === 0, 'zip list in parity workspace')

      const zipList = parseJsonOutput(zr.stdout)
      const wrappedList = parseJsonOutput(
        cli(['list', '-f', wrappedDesign], { cwd: ws }).stdout
      )
      const flatList = parseJsonOutput(
        cli(['list', '-f', flatDesign], { cwd: ws }).stdout
      )
      const fp = [zipList, wrappedList, flatList].map(artboardFingerprint)
      assertEq(fp[1], fp[0], 'wrapped === zip')
      assertEq(fp[2], fp[0], 'flat === zip')
      assert(
        zipList.artboards.every(a => a.size > 0),
        'sizes non-zero across modes'
      )
    }
  ],
  [
    'folder staleness: touching an inner html regenerates list.json',
    async () => {
      const flatListPath = path.join(ws, '.sketch-cache', 'flat', 'list.json')
      assert(fs.existsSync(flatListPath), 'flat list.json cached')
      fs.writeFileSync(flatListPath, '{ broken sentinel')
      const garbageMtime = fs.statSync(flatListPath).mtimeMs

      const inner = path.join(flatDesign, 'links', '新-9-登录.html')
      assert(fs.existsSync(inner), 'inner artboard html exists')
      const bumped = new Date(Date.now() + 3000)
      fs.utimesSync(inner, bumped, bumped)

      const r = cli(['list', '-f', flatDesign], { cwd: ws })
      assert(r.status === 0, `exit ${r.status}`)
      const data = parseJsonOutput(r.stdout)
      assertEq(data.artboards.length, 10, 'regenerated from folder design')
      assert(
        fs.statSync(flatListPath).mtimeMs > garbageMtime,
        'list.json rewritten after inner file touched'
      )
    }
  ]
])
