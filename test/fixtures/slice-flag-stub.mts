/**
 * sliceBoard 断档判定单测 stub：直调 list 服务导出的纯函数 flagSliceOutliers，
 * 用例矩阵由 test/10-slice-flag.mjs 经 argv 传入（期望值留在 .mjs 断言里），
 * 逐个执行并按行输出 `name\tJSON(flags)`。
 * 由 10-slice-flag.mjs 用 esbuild 打包为 CJS 后执行：
 *   node slice-flag-stub.cjs '<cases-json>'
 */
import { flagSliceOutliers } from '@/services/list'

const cases = JSON.parse(process.argv[2] ?? '[]') as {
  name: string
  shares: number[]
}[]

if (!Array.isArray(cases) || !cases.length) {
  console.error("usage: slice-flag-stub.cjs '<cases-json>'")
  process.exit(2)
}

for (const c of cases) {
  console.log(`${c.name}\t${JSON.stringify(flagSliceOutliers(c.shares))}`)
}
