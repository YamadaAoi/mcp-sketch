import type { InstallConfig } from '../installer'
import SketchLeaderPrompt from './sketch-leader/index.md'
import SketchInitPrompt from './sketch-init/index.md'
import SketchPickPrompt from './sketch-pick/index.md'
import SketchSplitPrompt from './sketch-split/index.md'
import SketchBoundPrompt from './sketch-bound/index.md'
import SketchGenBasePrompt from './sketch-gen-base/index.md'
import SketchLayoutPrompt from './sketch-layout/index.md'
import SketchDrawPrompt from './sketch-draw/index.md'
import SketchDrawCheckPrompt from './sketch-draw-check/index.md'
import SketchScribePrompt from './sketch-scribe/index.md'

export const AgentPool: InstallConfig[] = [
  {
    prompt: SketchLeaderPrompt,
    name: 'sketch-leader',
    description: '前端 Leader，负责分析问题、分配任务、审核结果，绝不写代码',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-leader.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'disallowedTools',
            value: 'Write, Edit'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-leader.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'mode',
            value: 'primary'
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'permission',
            value: {
              '*': 'allow',
              write: 'deny',
              edit: 'deny',
              bash: {
                '*': 'allow',
                'unzip *': 'deny',
                'Expand-Archive *': 'deny'
              }
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchScribePrompt,
    name: 'sketch-scribe',
    description: '状态记录员，负责管理画板状态文件的创建和更新',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-scribe.md',
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'tools',
            value: 'Read, Write, Edit'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-scribe.md',
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
            key: 'hidden',
            value: true
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              write: 'allow',
              edit: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchInitPrompt,
    name: 'sketch-init',
    description:
      '技术负责人，阅读项目代码，总结技术栈/代码风格/项目结构，生成 proj-init.md',
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
            key: 'hidden',
            value: true
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'permission',
            value: {
              '*': 'allow'
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
      '设计助理，提取 Sketch Meaxure 设计稿 (zip/folder) 里所有画板，供用户单选',
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
            value: 'Read, Glob, Grep, Bash, AskUserQuestion'
          },
          {
            key: 'disallowedTools',
            value: 'Write, Edit'
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
            key: 'hidden',
            value: true
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              glob: 'allow',
              grep: 'allow',
              bash: {
                '*': 'allow',
                'npx -y mcp-sketch *': 'allow',
                'unzip *': 'deny'
              },
              question: 'allow',
              write: 'deny',
              edit: 'deny'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchSplitPrompt,
    name: 'sketch-split',
    description:
      '前端架构师，分析设计稿画板预览图，合理拆分组件，制定组件规划表',
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
            value: 'Read, Glob, Grep, Bash'
          },
          {
            key: 'disallowedTools',
            value: 'Write, Edit'
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
            key: 'hidden',
            value: true
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              glob: 'allow',
              grep: 'allow',
              bash: {
                '*': 'allow',
                'npx -y mcp-sketch *': 'allow',
                'unzip *': 'deny'
              },
              write: 'deny',
              edit: 'deny'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchBoundPrompt,
    name: 'sketch-bound',
    description:
      '中级前端开发，根据设计稿图层数据，修正组件规划的 rect，确保与设计稿一致',
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
            value: 'Read, Glob, Grep, Bash'
          },
          {
            key: 'disallowedTools',
            value: 'Write, Edit'
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
            key: 'hidden',
            value: true
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              glob: 'allow',
              grep: 'allow',
              bash: {
                '*': 'allow',
                'npx -y mcp-sketch *': 'allow',
                'unzip *': 'deny'
              },
              write: 'deny',
              edit: 'deny'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchGenBasePrompt,
    name: 'sketch-gen-base',
    description: '初级前端开发，基于组件规划布局数据，生成基础的组件代码',
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
            key: 'hidden',
            value: true
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              write: 'allow',
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
    prompt: SketchLayoutPrompt,
    name: 'sketch-layout',
    description:
      '中级前端开发，根据组件规划表，完成路由配置和父组件布局（子容器 div + import）',
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
            key: 'disallowedTools',
            value: 'Write'
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
            key: 'hidden',
            value: true
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              write: 'deny',
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
    prompt: SketchDrawPrompt,
    name: 'sketch-draw',
    description: '高级前端开发，提取画板指定区域设计结构，生成前端组件功能代码',
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
            value: 'Read, Write, Edit, Glob, Grep, Bash'
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
            key: 'hidden',
            value: true
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              write: 'allow',
              edit: 'allow',
              glob: 'allow',
              grep: 'allow',
              bash: {
                '*': 'allow',
                'npx -y mcp-sketch *': 'allow',
                'unzip *': 'deny'
              }
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchDrawCheckPrompt,
    name: 'sketch-draw-check',
    description: '质量保障工程师，审核绘制的组件是否符合要求',
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
            key: 'disallowedTools',
            value: 'Write, Edit'
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
            key: 'hidden',
            value: true
          },
          {
            key: 'temperature',
            value: 0.1
          },
          {
            key: 'permission',
            value: {
              read: 'allow',
              write: 'deny',
              edit: 'deny',
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
