import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Open } from 'unzipper'

export const REPO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
)
export const CLI = path.join(REPO, 'dist', 'index.js')
export const TMP_DIR = path.join(REPO, 'test', '.tmp')
export const FIXTURE_ZIP = path.join(
  REPO,
  'src',
  'sketch',
  '电磁信号保密监测器html.zip'
)
export const FIXTURE_NAME = '电磁信号保密监测器html'
export const PAGE = '新'

/**
 * 运行 dist CLI。每次调用都是独立进程：
 * - cwd 决定 .env.sketch / .sketch-cache / 相对路径的基准
 * - env 里值为 undefined 的键会从子进程环境中删除（用于屏蔽 PREVIEW_URL 等）
 */
export function cli(args, opts = {}) {
  const env = { ...process.env }
  for (const [k, v] of Object.entries(opts.env ?? {})) {
    if (v === undefined) delete env[k]
    else env[k] = v
  }
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: opts.cwd ?? REPO,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    env
  })
}

/**
 * 从 CLI stdout 提取业务 JSON：
 * list 输出为 `JSON + "\n\nsaved to <abs>"`，analyze/compare 输出为纯 JSON
 */
export function parseJsonOutput(stdout, label = 'output') {
  const marker = '\n\nsaved to '
  const idx = stdout.indexOf(marker)
  const text = idx >= 0 ? stdout.slice(0, idx) : stdout
  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error(
      `${label} is not valid JSON (${e.message}):\n${stdout.slice(0, 400)}`
    )
  }
}

/** 创建干净的临时工作区（test/.tmp/<name>），返回绝对路径 */
export function makeWorkspace(name) {
  const dir = path.join(TMP_DIR, name)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

/** 递归列出目录下所有文件（相对 dir 的 posix 风格路径，排序） */
export function walkFiles(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  const visit = cur => {
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name)
      if (entry.isDirectory()) visit(full)
      else out.push(path.relative(dir, full).replace(/\\/g, '/'))
    }
  }
  visit(dir)
  return out.sort()
}

/**
 * 解压 zip 到目录（folder 模式测试铺底用；测试代码不受 skill 铁律约束）
 * @param opts.stripPrefix 摘掉该前缀的条目（外层包裹目录 → flat 布局）
 */
export async function extractZip(zipPath, destDir, opts = {}) {
  const dir = await Open.file(zipPath)
  for (const f of dir.files) {
    if (f.type === 'Directory') continue
    let rel = f.path.replace(/\\/g, '/')
    if (opts.stripPrefix) {
      if (!rel.startsWith(opts.stripPrefix)) continue
      rel = rel.slice(opts.stripPrefix.length)
    }
    const target = path.join(destDir, ...rel.split('/'))
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, await f.buffer())
  }
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg ?? 'assertion failed')
}

export function assertEq(actual, expected, msg) {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  if (a !== b) {
    throw new Error(
      `${msg ?? 'assertEq'}\n  actual:   ${a?.slice(0, 600)}\n  expected: ${b?.slice(0, 600)}`
    )
  }
}

/** 顺序执行用例，打印 PASS/FAIL 与汇总；失败置 process.exitCode = 1 */
export async function runSuite(suite, tests) {
  console.log(`\n=== ${suite} ===`)
  let failed = 0
  for (const [name, fn] of tests) {
    try {
      await fn()
      console.log(`  PASS  ${name}`)
    } catch (e) {
      failed++
      console.log(`  FAIL  ${name}`)
      console.log(
        String(e?.message ?? e)
          .split('\n')
          .map(l => `        ${l}`)
          .join('\n')
      )
    }
  }
  console.log(
    `--- ${suite}: ${tests.length - failed}/${tests.length} passed ---`
  )
  if (failed) process.exitCode = 1
  return { total: tests.length, failed }
}

/** 定位数组列序（与 LAYER_COLUMNS 严格对齐，跨套件引用同一份事实） */
export const COLS = [
  'index',
  'name',
  'type',
  'x',
  'y',
  'w',
  'h',
  'content',
  'css',
  'assets'
]

export async function hasSharp() {
  try {
    await import('sharp')
    return true
  } catch {
    return false
  }
}

/** analyze 快捷方式：登录画板 + 追加参数 */
export function analyzeLogin(ws, extra = []) {
  const r = cli(
    ['analyze', '-f', FIXTURE_ZIP, '--pn', PAGE, '--an', '登录', ...extra],
    { cwd: ws }
  )
  if (r.status !== 0) {
    throw new Error(`analyze exited ${r.status}\n${r.stderr.slice(0, 800)}`)
  }
  return JSON.parse(r.stdout)
}
