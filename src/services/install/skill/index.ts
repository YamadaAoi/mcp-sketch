import type { InstallConfig } from '../installer'
import SketchPickPrompt from './sketch-pick/index.md'
import SketchAnalyzeArtboardPrompt from './sketch-analyze-artboard/index.md'
import SketchSplitPrompt from './sketch-split/index.md'
import SketchInitPrompt from './sketch-init/index.md'
import SketchInitComponentsPrompt from './sketch-init-components/index.md'
import SketchGenBasePrompt from './sketch-gen-base/index.md'
import SketchLayoutPrompt from './sketch-layout/index.md'
import SketchInsertLayoutPrompt from './sketch-insert-layout/index.md'
import SketchLayoutCheckPrompt from './sketch-layout-check/index.md'
import SketchInsertLayoutCheckPrompt from './sketch-insert-layout-check/index.md'
import SketchPreviewPrompt from './sketch-preview/index.md'
import SketchDrawPrompt from './sketch-draw/index.md'
import SketchDrawCheckPrompt from './sketch-draw-check/index.md'
import SketchGenBaseCheckPrompt from './sketch-gen-base-check/index.md'
import SketchInitCheckPrompt from './sketch-init-check/index.md'
import SketchSplitCheckPrompt from './sketch-split-check/index.md'
import SketchCodePrompt from './sketch-code/index.md'

export const SkillPool: InstallConfig[] = [
  {
    name: 'sketch-init',
    description: '项目架构师，扫描项目配置生成 proj-init.md',
    prompt: SketchInitPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Write Edit Glob Grep Bash'
          },
          {
            key: 'disallowed-tools',
            value: 'Bash(unzip *) PowerShell(Expand-Archive *)'
          }
        ]
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
    name: 'sketch-init-components',
    description: '组件分析工程师，分析项目组件生态生成 components-init.md',
    prompt: SketchInitComponentsPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Write Edit Glob Grep Bash'
          },
          {
            key: 'disallowed-tools',
            value: 'Bash(unzip *) PowerShell(Expand-Archive *)'
          }
        ]
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
    name: 'sketch-pick',
    description: '设计助理，提取画板列表，供用户单选',
    prompt: SketchPickPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value:
              'Read Glob Grep Bash Bash(npx -y mcp-sketch *) AskUserQuestion'
          },
          {
            key: 'disallowed-tools',
            value: 'Write Edit Bash(unzip *) PowerShell(Expand-Archive *)'
          }
        ]
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
    name: 'sketch-analyze-artboard',
    description: '解析单个画板并落盘图层数据，不做组件解读',
    prompt: SketchAnalyzeArtboardPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Glob Grep Bash Bash(npx -y mcp-sketch *)'
          },
          {
            key: 'disallowed-tools',
            value: 'Write Edit Bash(unzip *) PowerShell(Expand-Archive *)'
          }
        ]
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
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Glob Grep Bash Bash(npx -y mcp-sketch *)'
          },
          {
            key: 'disallowed-tools',
            value: 'Write Edit Bash(unzip *) PowerShell(Expand-Archive *)'
          }
        ]
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
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Write Edit Glob Grep Bash'
          }
        ]
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
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Write Edit Glob Grep Bash'
          }
        ]
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
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Glob Grep Bash'
          },
          {
            key: 'disallowed-tools',
            value: 'Write Edit'
          }
        ]
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
    name: 'sketch-insert-layout',
    description: '中级前端开发，布局 section 组件并插入到目标页面',
    prompt: SketchInsertLayoutPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Write Edit Glob Grep Bash'
          }
        ]
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
    name: 'sketch-insert-layout-check',
    description: '审核专员，审核 section 组件插入目标页面的结果',
    prompt: SketchInsertLayoutCheckPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Glob Grep Bash'
          },
          {
            key: 'disallowed-tools',
            value: 'Write Edit'
          }
        ]
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
    name: 'sketch-preview',
    description: '启动本地服务器并打开浏览器预览页面',
    prompt: SketchPreviewPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Glob Grep Bash'
          },
          {
            key: 'disallowed-tools',
            value: 'Write Edit'
          }
        ]
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
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Write Edit Glob Grep Bash Bash(npx -y mcp-sketch *)'
          },
          {
            key: 'disallowed-tools',
            value: 'Bash(unzip *) PowerShell(Expand-Archive *)'
          }
        ]
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
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Glob Grep Bash'
          },
          {
            key: 'disallowed-tools',
            value: 'Write Edit'
          }
        ]
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
    name: 'sketch-code',
    description: '通用开发工程师，处理修改/重构等无设计稿的开发任务',
    prompt: SketchCodePrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Write Edit Glob Grep Bash'
          }
        ]
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
    name: 'sketch-gen-base-check',
    description: '质量保障工程师，审核基础组件代码是否符合规范',
    prompt: SketchGenBaseCheckPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Glob Grep Bash'
          },
          {
            key: 'disallowed-tools',
            value: 'Write Edit'
          }
        ]
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
    name: 'sketch-init-check',
    description: '质量保障工程师，审核项目初始化文档是否符合规范',
    prompt: SketchInitCheckPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Glob Grep Bash'
          },
          {
            key: 'disallowed-tools',
            value: 'Write Edit'
          }
        ]
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
    name: 'sketch-split-check',
    description: '质量保障工程师，审核组件拆分结果，包括路径和命名规范',
    prompt: SketchSplitCheckPrompt,
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'user-invocable', value: false },
          {
            key: 'allowed-tools',
            value: 'Read Glob Grep Bash'
          },
          {
            key: 'disallowed-tools',
            value: 'Write Edit'
          }
        ]
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
