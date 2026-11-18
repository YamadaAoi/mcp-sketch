import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { assert, assertEq, runSuite, REPO, TMP_DIR } from './helpers.mjs'

const STUB_SRC = path.join(REPO, 'test', 'fixtures', 'slice-flag-stub.mts')
const STUB_OUT = path.join(TMP_DIR, 'slice-flag-stub.cjs')

// 打包 stub（list 服务链路引用 .md 资源与 sharp 等，需与 tsup 相同的 alias/loader/externals 处理）
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

// 用例矩阵：shares 为各画板切图占比，expect 为逐画板的疑似标记期望
const CASES = [
  {
    // 真实场景：切图板带大量文字标注（142 层中 32 层切图 ≈ 0.225），其余页面趋零 → 断档线取下限 0.1，标中
    name: 'annotated slice board (0.225) among low-share pages',
    shares: [0.225, 0.02, 0.03, 0.01, 0.04, 0.05, 0.02],
    expect: [true, false, false, false, false, false, false]
  },
  {
    // fixture 同型的图标密集设计：全员 0.16–0.36、无离群 → 中位数×3 高于全部占比，一个不标
    name: 'icon-dense design (all 0.16-0.36, no outlier)',
    shares: [0.33, 0.3, 0.28, 0.28, 0.22, 0.28, 0.31, 0.36, 0.16, 0.16],
    expect: Array(10).fill(false)
  },
  {
    // 整个设计没有切图：全员趋零 → 下限拦住，一个不标
    name: 'no slices at all',
    shares: [0, 0, 0, 0],
    expect: [false, false, false, false]
  },
  {
    // 全是切图板：中位数被自身拉高，无断档可言 → 一个不标
    name: 'all slice boards',
    shares: [0.9, 0.85, 0.88],
    expect: [false, false, false]
  },
  {
    // 单画板：无对照 → 不标
    name: 'single artboard',
    shares: [0.5],
    expect: [false]
  },
  {
    // 两画板：中位数被切图板自身拉高（(0.94+0.025)/2×3 > 1）→ 不标
    name: 'two artboards (median dragged by the board itself)',
    shares: [0.94, 0.025],
    expect: [false, false]
  },
  {
    // 多块切图板同时断档领先：下限生效（中位数 0.025×3=0.075 < 0.1），两块都标中
    name: 'two slice boards among ten',
    shares: [0.5, 0.4, 0.05, 0.04, 0.03, 0.02, 0.01, 0, 0, 0],
    expect: [true, true, false, false, false, false, false, false, false, false]
  },
  {
    // 中位数生效（3×0.155=0.465 > 下限）：正常页面 0.1–0.2 不误标，0.6 的切图板标中
    name: 'median-governed line (pages 0.1-0.2, board 0.6)',
    shares: [0.6, 0.2, 0.18, 0.16, 0.15, 0.14, 0.12, 0.1],
    expect: [true, false, false, false, false, false, false, false]
  },
  {
    // 下限防误标：0.05 虽是中位数（0）的无数倍，但低于下限 → 不标
    name: 'floor blocks tiny-share false positive',
    shares: [0.05, 0.01, 0, 0, 0],
    expect: [false, false, false, false, false]
  },
  {
    // 边界语义：占比恰等于下限（中位数为 0）→ 标中（>=）
    name: 'boundary: share equal to floor flags',
    shares: [0.1, 0, 0, 0],
    expect: [true, false, false, false]
  }
]

await runSuite('10-slice-flag: sliceBoard outlier detection (pure function)', [
  [
    'case matrix: real-world / adaptive / degenerate / multi-flag / floor & median governed',
    async () => {
      const r = spawnSync(
        process.execPath,
        [
          STUB_OUT,
          JSON.stringify(CASES.map(({ name, shares }) => ({ name, shares })))
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
        assertEq(
          JSON.parse(line.slice(tab + 1)),
          CASES[i].expect,
          `flags for "${CASES[i].name}"`
        )
      })
    }
  ]
])
