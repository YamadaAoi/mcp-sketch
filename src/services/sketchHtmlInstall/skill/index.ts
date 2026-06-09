import type { InstallConfig } from '../installer'
import SketchWorkflowPrompt from './sketch-workflow/index.md?raw'

export const SkillPool: InstallConfig[] = [
  {
    prompt: SketchWorkflowPrompt,
    name: 'sketch-workflow',
    description: '选择画板后全自动 Sketch 代码生成工作流',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'allowed-tools',
            value: 'Edit Write Bash PowerShell'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/skills',
        fileName: 'SKILL.md',
        isNested: true,
        meta: [
          {
            key: 'name'
          },
          {
            key: 'description'
          },
          {
            key: 'metadata',
            value: {
              version: __VERSION__
            }
          }
        ]
      }
    ]
  }
]
