import type { InstallConfig } from '../installer'
import SketchPrompt from './sketch/index.md'
import initReference from './sketch/references/init.md'
import overviewReference from './sketch/references/overview.md'
import drawReference from './sketch/references/draw.md'

export const SkillPool: InstallConfig[] = [
  {
    name: 'sketch',
    description:
      '帮助根据 Sketch Meaxure 导出的设计稿（html zip 或目录）还原前端页面：画板概览与设计 token、图层与切图数据提取、开发服务、截图对比修正。当用户要求根据设计稿还原/绘制页面、获取画板列表或切图、对比页面截图与设计稿，或输入 /sketch init、/sketch overview、/sketch draw 时使用',
    prompt: SketchPrompt,
    references: {
      init: initReference,
      overview: overviewReference,
      draw: drawReference
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
