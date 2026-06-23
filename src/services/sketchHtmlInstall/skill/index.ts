import type { InstallConfig } from '../installer'
import SketchPickPrompt from './sketch-pick/index.md'
import SketchSplitPrompt from './sketch-split/index.md'
import SketchBoundPrompt from './sketch-bound/index.md'
import SketchGenBasePrompt from './sketch-gen-base/index.md'
import SketchLayoutPrompt from './sketch-layout/index.md'
import SketchLayoutCheckPrompt from './sketch-layout-check/index.md'
import SketchDrawPrompt from './sketch-draw/index.md'
import SketchDrawCheckPrompt from './sketch-draw-check/index.md'

export const SkillPool: InstallConfig[] = [
  {
    name: 'sketch-pick',
    description: '设计助理，提取画板列表，供用户单选',
    prompt: SketchPickPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      }
    ]
  },
  {
    name: 'sketch-split',
    description: '前端架构师，拆分组件，制定组件规划表',
    prompt: SketchSplitPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      }
    ]
  },
  {
    name: 'sketch-bound',
    description: '中级前端开发，修正组件 rect，确保与设计稿一致',
    prompt: SketchBoundPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      }
    ]
  },
  {
    name: 'sketch-gen-base',
    description: '初级前端开发，生成基础组件代码',
    prompt: SketchGenBasePrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      }
    ]
  },
  {
    name: 'sketch-layout',
    description: '中级前端开发，配置路由和父组件布局',
    prompt: SketchLayoutPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      }
    ]
  },
  {
    name: 'sketch-layout-check',
    description: '审核专员，审核父组件布局是否符合要求',
    prompt: SketchLayoutCheckPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      }
    ]
  },
  {
    name: 'sketch-draw',
    description: '高级前端开发，绘制组件功能代码',
    prompt: SketchDrawPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      }
    ]
  },
  {
    name: 'sketch-draw-check',
    description: '质量保障工程师，审核组件是否符合要求',
    prompt: SketchDrawCheckPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [{ key: 'name' }, { key: 'description' }]
      }
    ]
  }
]
