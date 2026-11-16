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
  PAGE
} from './helpers.mjs'

const ws = makeWorkspace('06-errors')

function assertFails(r, label, expectIncludes) {
  assert(r.status !== 0, `${label}: expected non-zero exit, got ${r.status}`)
  const out = (r.stderr + r.stdout).trim()
  assert(out.length > 0, `${label}: error output printed`)
  if (expectIncludes) {
    assert(
      out.includes(expectIncludes),
      `${label}: output should mention "${expectIncludes}"\n${out.slice(0, 500)}`
    )
  }
}

await runSuite('06-errors: invalid inputs exit 1 with messages', [
  [
    'list: missing design file → exit 1',
    async () => {
      assertFails(
        cli(['list', '-f', path.join(ws, 'missing.zip')], { cwd: ws }),
        'missing zip'
      )
    }
  ],
  [
    'analyze: missing design file → exit 1',
    async () => {
      assertFails(
        cli(
          [
            'analyze',
            '-f',
            path.join(ws, 'missing.zip'),
            '-p',
            PAGE,
            '-a',
            '登录'
          ],
          { cwd: ws }
        ),
        'missing zip analyze'
      )
    }
  ],
  [
    'analyze: nonexistent artboard → exit 1 with not-found hint',
    async () => {
      assertFails(
        cli(['analyze', '-f', FIXTURE_ZIP, '-p', PAGE, '-a', '不存在'], {
          cwd: ws
        }),
        'nonexistent artboard',
        'not found'
      )
    }
  ],
  [
    'analyze: rect is not JSON → exit 1',
    async () => {
      assertFails(
        cli(
          [
            'analyze',
            '-f',
            FIXTURE_ZIP,
            '-p',
            PAGE,
            '-a',
            '登录',
            '-r',
            'not-json'
          ],
          { cwd: ws }
        ),
        'bad rect json'
      )
    }
  ],
  [
    'analyze: rect wrong length → exit 1',
    async () => {
      assertFails(
        cli(
          [
            'analyze',
            '-f',
            FIXTURE_ZIP,
            '-p',
            PAGE,
            '-a',
            '登录',
            '-r',
            '[1,2]'
          ],
          { cwd: ws }
        ),
        'rect length'
      )
    }
  ],
  [
    'analyze: invalid type filter → exit 1',
    async () => {
      assertFails(
        cli(
          ['analyze', '-f', FIXTURE_ZIP, '-p', PAGE, '-a', '登录', '-t', 'foo'],
          { cwd: ws }
        ),
        'invalid type'
      )
    }
  ],
  [
    'list: folder without index.html → exit 1',
    async () => {
      const dir = path.join(ws, 'empty-design')
      fs.mkdirSync(path.join(dir, 'sub'), { recursive: true })
      fs.writeFileSync(path.join(dir, 'sub', 'readme.txt'), 'nothing here')
      assertFails(cli(['list', '-f', dir], { cwd: ws }), 'folder without index')
    }
  ],
  [
    'list: file with .zip extension but not an archive → exit 1',
    async () => {
      const fake = path.join(ws, 'bad.zip')
      fs.writeFileSync(fake, 'this is not a zip archive at all')
      assertFails(cli(['list', '-f', fake], { cwd: ws }), 'garbage zip')
    }
  ],
  [
    'dev: PREVIEW_URL not configured → exit 1',
    async () => {
      assertFails(
        cli(['dev'], { cwd: ws, env: { PREVIEW_URL: undefined } }),
        'dev without PREVIEW_URL',
        'PREVIEW_URL'
      )
    }
  ],
  [
    'compare: missing -s → exit 1 naming the required option',
    async () => {
      assertFails(
        cli(['compare', '-b', path.join(ws, 'shot.png')], { cwd: ws }),
        'compare missing screenshot',
        '-s, --screenshot_path'
      )
    }
  ],
  [
    'analyze: legacy --pn/--an aliases still work',
    async () => {
      const r = cli(
        ['analyze', '-f', FIXTURE_ZIP, '--pn', PAGE, '--an', '登录'],
        { cwd: ws }
      )
      assert(
        r.status === 0,
        `legacy alias exit ${r.status}\n${r.stderr.slice(0, 500)}`
      )
      assertEq(parseJsonOutput(r.stdout).total, 15, 'legacy alias total')
    }
  ],
  [
    'analyze: missing -p/-a → exit 1 naming the canonical flags',
    async () => {
      assertFails(
        cli(['analyze', '-f', FIXTURE_ZIP], { cwd: ws }),
        'missing page/artboard',
        '-p, --page'
      )
    }
  ],
  [
    'analyze: --help shows canonical flags + examples, hides legacy aliases',
    async () => {
      const r = cli(['analyze', '--help'], { cwd: ws })
      assertEq(r.status, 0, '--help exit 0')
      const out = r.stdout
      for (const frag of [
        '-p, --page <NAME>',
        '-a, --artboard <NAME>',
        '-r, --rect',
        'Examples:'
      ]) {
        assert(out.includes(frag), `--help should contain "${frag}"`)
      }
      assert(!out.includes('--pn'), '--help should not advertise legacy --pn')
    }
  ]
])
