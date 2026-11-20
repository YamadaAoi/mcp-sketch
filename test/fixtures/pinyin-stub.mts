/**
 * toPinyin 拼音转写单测 stub：直调 assembleArtboard 导出的纯函数 toPinyin，
 * 用例矩阵由 test/11-pinyin.mjs 经 argv 传入，逐个执行并按行输出 `name\tresult`。
 * 由 11-pinyin.mjs 用 esbuild 打包为 CJS 后执行：
 *   node pinyin-stub.cjs '<cases-json>'
 */
import { toPinyin } from '@/services/analyze/assembleArtboard'

const cases = JSON.parse(process.argv[2] ?? '[]') as {
  name: string
  input: string
}[]

if (!Array.isArray(cases) || !cases.length) {
  console.error("usage: pinyin-stub.cjs '<cases-json>'")
  process.exit(2)
}

for (const c of cases) {
  console.log(`${c.name}\t${toPinyin(c.input)}`)
}
