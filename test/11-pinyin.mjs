import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { assert, assertEq, runSuite, REPO, TMP_DIR } from './helpers.mjs'

const STUB_SRC = path.join(REPO, 'test', 'fixtures', 'pinyin-stub.mts')
const STUB_OUT = path.join(TMP_DIR, 'pinyin-stub.cjs')

// 打包 stub（assembleArtboard 链路引用 .md 资源与 sharp 等，需与 tsup 相同的 alias/loader/externals 处理）
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

// 用例矩阵：页面/画板目录与切图文件名共用 toPinyin，输出必须是纯 ASCII（[a-z0-9-]），
// 否则文件名携带 ü 等字符会造成 import 隐患（绿色 → lü-se 的事故）
const CASES = [
  {
    // 反馈事故原案：默认 toneType:'none' 无法把 ü 降级为 u，须输出 lv-se
    name: '绿色 (the reported bug: lü-se → lv-se)',
    input: '绿色',
    expect: 'lv-se'
  },
  { name: '女用户 (nü → nv)', input: '女用户', expect: 'nv-yong-hu' },
  { name: '旅游 (lü → lv)', input: '旅游', expect: 'lv-you' },
  {
    name: '绿色按钮点击态',
    input: '绿色按钮点击态',
    expect: 'lv-se-an-niu-dian-ji-tai'
  },
  { name: '编组 7 (fixture 事实)', input: '编组 7', expect: 'bian-zu-7' },
  { name: 'ASCII passthrough + lower', input: 'Logo-01', expect: 'logo-01' },
  { name: '中英混排', input: '首页Home横幅', expect: 'shou-ye-home-heng-fu' },
  {
    name: '纯符号回退内容哈希',
    input: '！！！',
    expect: /^name-[0-9a-f]{8}$/
  }
]

await runSuite('11-pinyin: ASCII-safe pinyin transliteration (toPinyin)', [
  [
    'case matrix: ü→v, toneless, dash-joined, ASCII-only, hash fallback',
    async () => {
      const r = spawnSync(
        process.execPath,
        [
          STUB_OUT,
          JSON.stringify(CASES.map(({ name, input }) => ({ name, input })))
        ],
        { encoding: 'utf8' }
      )
      assert(r.status === 0, `stub exit ${r.status}\n${r.stderr.slice(0, 800)}`)
      const lines = r.stdout.trim().split(/\r?\n/)
      assertEq(lines.length, CASES.length, 'one output line per case')
      lines.forEach((line, i) => {
        const tab = line.indexOf('\t')
        assert(tab > 0, `line ${i} carries a tab separator`)
        assertEq(line.slice(0, tab), CASES[i].name, `case ${i} name echoed`)
        const actual = line.slice(tab + 1)
        const c = CASES[i]
        if (c.expect instanceof RegExp) {
          assert(
            c.expect.test(actual),
            `case "${c.name}": expected ${c.expect}, got "${actual}"`
          )
        } else {
          assertEq(actual, c.expect, `case "${c.name}"`)
        }
        // 不变量：输出必须是纯 ASCII（文件名可安全 import）
        assert(
          /^[\x21-\x7E]*$/.test(actual),
          `case "${c.name}" output must be printable ASCII, got "${actual}"`
        )
      })
    }
  ]
])
