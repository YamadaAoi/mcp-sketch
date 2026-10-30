import type { InstallConfig } from '../installer'
import SketchPrompt from './sketch/index.md'
import initReference from './sketch/references/init.md'
import overviewReference from './sketch/references/overview.md'

export const SkillPool: InstallConfig[] = [
  {
    name: 'sketch',
    description:
      '帮助根据sketch meaxure设计稿绘制页面。当用户输入 /sketch init、/sketch overview 或 请求根据sketch meaxure设计稿绘制页面时使用',
    prompt: SketchPrompt,
    references: {
      init: initReference,
      overview: overviewReference
    },
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        meta: [{ key: 'name' }, { key: 'description' }]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/skills',
        fileName: 'SKILL.md',
        meta: [{ key: 'name' }, { key: 'description' }]
      }
    ]
  }
]
