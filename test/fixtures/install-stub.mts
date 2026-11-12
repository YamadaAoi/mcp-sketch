/**
 * install 测试专用 stub：绕过 CLI 的交互式 prompts（agent 选择 / 冲突处理），
 * 直接调用 installer 的 install(cwd, agent, SkillPool)。
 * 由 07-install.mjs 用 esbuild 打包为 CJS 后在干净目录中执行：
 *   node install-stub.cjs <cwd> <claude|opencode>
 */
import { install } from '@/services/install/installer'
import { SkillPool } from '@/services/install/skill'

const [cwd, agent] = process.argv.slice(2)

if (!cwd || (agent !== 'claude' && agent !== 'opencode')) {
  console.error('usage: install-stub.cjs <cwd> <claude|opencode>')
  process.exit(2)
}

install(cwd, agent, SkillPool)
  .then(() => {
    console.log(`stub: installed skill for ${agent}`)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
