import type { InstallConfig } from '../installer'
import SketchInitPrompt from './sketch-init/index.md'
import SketchInitCheckPrompt from './sketch-init-check/index.md'
import SketchPickPrompt from './sketch-pick/index.md'
import SketchSplitPrompt from './sketch-split/index.md'
import SketchBoundPrompt from './sketch-bound/index.md'
import SketchGenBasePrompt from './sketch-gen-base/index.md'
import SketchGenBaseCheckPrompt from './sketch-gen-base-check/index.md'
import SketchLayoutPrompt from './sketch-layout/index.md'
import SketchLayoutCheckPrompt from './sketch-layout-check/index.md'
import SketchDrawPrompt from './sketch-draw/index.md'
import SketchDrawCheckPrompt from './sketch-draw-check/index.md'

export const AgentPool: InstallConfig[] = [
  {
    prompt: SketchInitPrompt,
    name: 'sketch-init',
    description:
      '阅读项目代码，总结技术栈/代码风格/项目结构，生成 proj-init.md',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-init.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Read, Write, Edit, Glob, Grep, Bash'
          },
          {
            key: 'permissionMode',
            value: 'auto'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-init.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'subagent'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'tools',
            value: {
              read: true,
              write: true,
              edit: true,
              glob: true,
              grep: true,
              bash: true
            }
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              edit: 'allow',
              glob: 'allow',
              grep: 'allow',
              bash: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchInitCheckPrompt,
    name: 'sketch-init-check',
    description: '审核 proj-init.md 文件，确认其符合项目实际情况',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-init-check.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Read, Glob, Grep, Bash'
          },
          {
            key: 'permissionMode',
            value: 'auto'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-init-check.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'subagent'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'tools',
            value: {
              read: true,
              glob: true,
              grep: true,
              bash: true
            }
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              glob: 'allow',
              grep: 'allow',
              bash: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchPickPrompt,
    name: 'sketch-pick',
    description:
      '提取 Sketch Meaxure 设计稿 (zip/folder) 里所有画板，供用户单选',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-pick.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Bash, AskUserQuestion'
          },
          {
            key: 'permissionMode',
            value: 'auto'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-pick.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'subagent'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'tools',
            value: {
              bash: true,
              question: true
            }
          },
          {
            key: 'permission',
            value: {
              bash: 'allow',
              question: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchSplitPrompt,
    name: 'sketch-split',
    description: '分析设计稿画板预览图，合理拆分组件，制定组件规划表',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-split.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Bash'
          },
          {
            key: 'permissionMode',
            value: 'auto'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-split.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'subagent'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'tools',
            value: {
              bash: true
            }
          },
          {
            key: 'permission',
            value: {
              bash: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchBoundPrompt,
    name: 'sketch-bound',
    description: '根据设计稿图层数据，修正组件规划的 rect，确保与设计稿一致',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-bound.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Bash'
          },
          {
            key: 'permissionMode',
            value: 'auto'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-bound.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'subagent'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'tools',
            value: {
              bash: true
            }
          },
          {
            key: 'permission',
            value: {
              bash: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchGenBasePrompt,
    name: 'sketch-gen-base',
    description: '基于组件规划布局数据，生成基础的组件代码',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-gen-base.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Read, Write, Edit, Glob, Bash'
          },
          {
            key: 'permissionMode',
            value: 'auto'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-gen-base.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'subagent'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'tools',
            value: {
              read: true,
              write: true,
              edit: true,
              glob: true,
              bash: true
            }
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              edit: 'allow',
              glob: 'allow',
              bash: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchGenBaseCheckPrompt,
    name: 'sketch-gen-base-check',
    description: '审核基础组件是否符合要求',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-gen-base-check.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Read, Glob, Grep, Bash'
          },
          {
            key: 'permissionMode',
            value: 'auto'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-gen-base-check.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'subagent'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'tools',
            value: {
              read: true,
              glob: true,
              grep: true,
              bash: true
            }
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              glob: 'allow',
              grep: 'allow',
              bash: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchLayoutPrompt,
    name: 'sketch-layout',
    description:
      '根据组件规划表，完成路由配置和父组件布局（子容器 div + import）',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-layout.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Read, Edit, Glob, Bash'
          },
          {
            key: 'permissionMode',
            value: 'auto'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-layout.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'subagent'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'tools',
            value: {
              read: true,
              edit: true,
              glob: true,
              bash: true
            }
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              edit: 'allow',
              glob: 'allow',
              bash: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchLayoutCheckPrompt,
    name: 'sketch-layout-check',
    description: '审核布局是否符合要求',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-layout-check.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Read, Glob, Grep, Bash'
          },
          {
            key: 'permissionMode',
            value: 'auto'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-layout-check.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'subagent'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'tools',
            value: {
              read: true,
              glob: true,
              grep: true,
              bash: true
            }
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              glob: 'allow',
              grep: 'allow',
              bash: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchDrawPrompt,
    name: 'sketch-draw',
    description: '提取画板指定区域设计结构，生成前端组件功能代码',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-draw.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Read, Edit, Glob, Bash'
          },
          {
            key: 'permissionMode',
            value: 'auto'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-draw.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'subagent'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'tools',
            value: {
              read: true,
              edit: true,
              glob: true,
              bash: true
            }
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              edit: 'allow',
              glob: 'allow',
              bash: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchDrawCheckPrompt,
    name: 'sketch-draw-check',
    description: '审核绘制的组件是否符合要求',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-draw-check.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Read, Glob, Grep, Bash'
          },
          {
            key: 'permissionMode',
            value: 'auto'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-draw-check.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'subagent'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'tools',
            value: {
              read: true,
              glob: true,
              grep: true,
              bash: true
            }
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              glob: 'allow',
              grep: 'allow',
              bash: 'allow'
            }
          }
        ]
      }
    ]
  }
]
