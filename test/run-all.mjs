#!/usr/bin/env node
/**
 * 测试编排器：先构建（tsup + tsc），再按序执行 test/ 下的数字编号套件。
 * 用法：
 *   node test/run-all.mjs                # 构建并跑全部
 *   node test/run-all.mjs --no-build     # 跳过构建（dist 已是最新时）
 *   node test/run-all.mjs --clean        # 先清空 test/.tmp 再跑（干净起点）
 *   node test/run-all.mjs 01-list 08-mcp # 只跑指定套件
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ALL = [
  '01-list',
  '02-analyze',
  '03-assets',
  '04-compare',
  '05-folder',
  '06-errors',
  '07-install',
  '08-mcp'
]

const argv = process.argv.slice(2)
const noBuild = argv.includes('--no-build')
const doClean = argv.includes('--clean')
const picked = argv.filter(a => !a.startsWith('--'))
for (const name of picked) {
  if (!ALL.includes(name)) {
    console.error(`unknown suite "${name}", available: ${ALL.join(', ')}`)
    process.exit(2)
  }
}
const suites = picked.length ? picked : ALL

if (doClean) {
  console.log('>>> cleaning test/.tmp ...')
  fs.rmSync(path.join(REPO, 'test', '.tmp'), { recursive: true, force: true })
}

if (!noBuild) {
  console.log('>>> building (pnpm build)...')
  const build = spawnSync('pnpm', ['build'], {
    cwd: REPO,
    shell: true,
    stdio: 'inherit'
  })
  if (build.status !== 0) {
    console.error('build failed, aborting')
    process.exit(1)
  }
}

const results = []
for (const suite of suites) {
  const file = path.join(REPO, 'test', `${suite}.mjs`)
  const r = spawnSync(process.execPath, [file], {
    cwd: REPO,
    stdio: 'inherit',
    timeout: 20 * 60 * 1000
  })
  results.push([suite, r.status === 0 ? 'pass' : `fail(${r.status})`])
}

console.log('\n===== summary =====')
for (const [suite, status] of results) {
  console.log(`  ${status === 'pass' ? 'PASS' : 'FAIL'}  ${suite}`)
}
const failed = results.filter(([, s]) => s !== 'pass').length
console.log(
  `${failed ? `${failed} suite(s) failed` : 'all suites passed'} (${results.length}/${ALL.length} run)`
)
if (failed) process.exit(1)
