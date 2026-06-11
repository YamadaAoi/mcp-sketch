import type { InstallConfig } from '../installer'
import SketchInitPrompt from './sketch-init/index.md'
import SketchPickPrompt from './sketch-pick/index.md'
import SketchSplitPrompt from './sketch-split/index.md'
import SketchLayoutPrompt from './sketch-layout/index.md'
import SketchDrawPrompt from './sketch-draw/index.md'

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
    description: '提取 Sketch 画板设计信息，拆分组件规划，创建组件和描述文档',
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
  }
]
