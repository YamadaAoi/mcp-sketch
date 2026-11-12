#!/usr/bin/env node
/**
 * 测试产物清理脚本。
 *
 * node test/clean.mjs         # 清理测试工作区 test/.tmp/
 * node test/clean.mjs --all   # 追加清理仓库根目录的 CLI 运行产物：
 *                             #   .sketch-cache/          （list.json / 预览图 / 切图索引）
 *                             #   src/assets/sketch/      （导出切图；src/assets 下其他内容不动）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const all = argv.includes('--all')
const unknown = argv.filter(a => a !== '--all')
if (unknown.length) {
  console.error(`unknown option(s): ${unknown.join(', ')} (supported: --all)`)
  process.exit(2)
}

function removeDir(label, dir) {
  if (!fs.existsSync(dir)) {
    console.log(`  skip  ${label} (not present)`)
    return
  }
  fs.rmSync(dir, { recursive: true, force: true })
  console.log(`  done  ${label} removed`)
}

console.log('cleaning test artifacts...')

// 1. 测试套件工作区（makeWorkspace 的产物全部在这里）
removeDir('test/.tmp/', path.join(REPO, 'test', '.tmp'))

// 2. 仓库根的 CLI 运行产物（手动在仓库根执行 CLI 时产生）
if (all) {
  removeDir('.sketch-cache/', path.join(REPO, '.sketch-cache'))

  const sketchAssets = path.join(REPO, 'src', 'assets', 'sketch')
  if (fs.existsSync(sketchAssets)) {
    fs.rmSync(sketchAssets, { recursive: true, force: true })
    console.log('  done  src/assets/sketch/ removed')
    const assetsRoot = path.join(REPO, 'src', 'assets')
    const rest = fs.existsSync(assetsRoot)
      ? fs.readdirSync(assetsRoot).filter(n => n !== 'sketch')
      : []
    if (!rest.length) {
      fs.rmSync(assetsRoot, { recursive: true, force: true })
      console.log('  done  empty src/assets/ removed')
    } else {
      console.log(
        `  keep  src/assets/ has non-sketch entries: ${rest.join(', ')}`
      )
    }
  } else {
    console.log('  skip  src/assets/sketch/ (not present)')
  }
} else {
  console.log(
    '  (use --all to also remove repo-root run artifacts: .sketch-cache/, src/assets/sketch/)'
  )
}
