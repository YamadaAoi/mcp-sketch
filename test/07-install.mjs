import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  makeWorkspace,
  walkFiles,
  assert,
  assertEq,
  runSuite,
  REPO,
  TMP_DIR
} from './helpers.mjs'

const STUB_SRC = path.join(REPO, 'test', 'fixtures', 'install-stub.mts')
const STUB_OUT = path.join(TMP_DIR, 'install-stub.cjs')
const SKILL_DIR = path.join(
  REPO,
  'src',
  'services',
  'install',
  'skill',
  'sketch'
)

// 打包 stub（installer 链路引用 .md 资源，需与 tsup 相同的 alias/loader 处理）
const bundle = spawnSync(
  'pnpm',
  [
    'exec',
    'esbuild',
    STUB_SRC,
    '--bundle',
    '--platform=node',
    '--format=cjs',
    `--outfile=${STUB_OUT}`,
    '--alias:@=./src',
    '--external:sharp',
    '--external:@aws-sdk/client-s3',
    '--loader:.md=text'
  ],
  { cwd: REPO, shell: true, encoding: 'utf8' }
)
if (bundle.status !== 0) {
  console.error(
    'esbuild stub bundling failed:\n' + bundle.stdout + bundle.stderr
  )
  process.exit(1)
}

function stubRun(ws, agent) {
  return spawnSync(process.execPath, [STUB_OUT, ws, agent], {
    encoding: 'utf8'
  })
}

function checkSkillFiles(ws, agent) {
  const base = agent === 'claude' ? '.claude/skills' : '.opencode/skills'
  const files = walkFiles(ws)
  assertEq(
    files,
    [
      `${base}/sketch/SKILL.md`,
      `${base}/sketch/references/draw.md`,
      `${base}/sketch/references/init.md`,
      `${base}/sketch/references/overview.md`
    ],
    `installed file set for ${agent}`
  )
  for (const f of files) {
    assert(!f.includes('_zhcn'), `zhcn master not installed (${f})`)
  }

  const skillMd = fs.readFileSync(
    path.join(ws, base, 'sketch', 'SKILL.md'),
    'utf8'
  )
  assert(skillMd.startsWith('---\n'), 'SKILL.md starts with frontmatter')
  const end = skillMd.indexOf('\n---', 4)
  assert(end > 0, 'frontmatter closed')
  const frontmatter = skillMd.slice(0, end)
  assert(
    frontmatter.includes('name: sketch'),
    'frontmatter declares skill name'
  )
  assert(
    /^description: .+/m.test(frontmatter),
    'frontmatter declares description'
  )
  assert(
    !/[\u4e00-\u9fff]/.test(frontmatter),
    'frontmatter (name/description) is English-only'
  )
  assert(
    frontmatter.includes('/sketch init'),
    'description mentions the fixed commands'
  )

  // 正文与 references 应与源码中的 canonical 英文版逐字一致
  const expectedPrompt = fs.readFileSync(
    path.join(SKILL_DIR, 'index.md'),
    'utf8'
  )
  const body = skillMd.slice(end + 4).replace(/^\n\n/, '')
  assertEq(body, expectedPrompt, 'SKILL.md body equals canonical prompt')
  for (const ref of ['init', 'overview', 'draw']) {
    const installed = fs.readFileSync(
      path.join(ws, base, 'sketch', 'references', `${ref}.md`),
      'utf8'
    )
    const canonical = fs.readFileSync(
      path.join(SKILL_DIR, 'references', `${ref}.md`),
      'utf8'
    )
    assertEq(installed, canonical, `references/${ref}.md equals canonical`)
  }
}

await runSuite('07-install: skill scaffolding (claude & opencode)', [
  [
    'claude: 4 files under .claude/skills, frontmatter + canonical content',
    async () => {
      const ws = makeWorkspace('07-install-claude')
      const r = stubRun(ws, 'claude')
      assert(r.status === 0, `stub exit ${r.status}\n${r.stderr}`)
      checkSkillFiles(ws, 'claude')
    }
  ],
  [
    'opencode: 4 files under .opencode/skills, frontmatter + canonical content',
    async () => {
      const ws = makeWorkspace('07-install-opencode')
      const r = stubRun(ws, 'opencode')
      assert(r.status === 0, `stub exit ${r.status}\n${r.stderr}`)
      checkSkillFiles(ws, 'opencode')
    }
  ],
  [
    'install is content-stable: re-install into a fresh dir yields identical files',
    async () => {
      const wsA = makeWorkspace('07-install-stable-a')
      const wsB = makeWorkspace('07-install-stable-b')
      assert(stubRun(wsA, 'claude').status === 0, 'first install')
      assert(stubRun(wsB, 'claude').status === 0, 'second install')
      const digest = ws =>
        walkFiles(ws)
          .map(f => `${f} ${fs.statSync(path.join(ws, f)).size}`)
          .join('\n')
      assertEq(
        digest(wsB),
        digest(wsA),
        'two installs produce identical output'
      )
    }
  ]
])
