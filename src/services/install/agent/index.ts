import type { InstallConfig } from '../installer'
import SketchLeaderPrompt from './sketch-leader/index.md'
import SketchAnalyzerPrompt from './sketch-analyzer/index.md'
import SketchArchitectPrompt from './sketch-architect/index.md'
import SketchDeveloperPrompt from './sketch-developer/index.md'
import SketchCheckerPrompt from './sketch-checker/index.md'

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
          { key: 'name' },
          { key: 'description' },
          { key: 'disallowedTools', value: 'Write, Edit, Skill' }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-leader.md',
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'mode', value: 'primary' },
          { key: 'temperature', value: 0.1 },
          {
            key: 'permission',
            value: {
              '*': 'allow',
              write: 'deny',
              edit: 'deny',
              skill: 'deny',
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
    prompt: SketchAnalyzerPrompt,
    name: 'sketch-analyzer',
    description: '分析师，调用技能和工具完成分析规划工作',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-analyzer.md',
        meta: [
          { key: 'name' },
          { key: 'description' },
          {
            key: 'tools',
            value: 'Read, Glob, Grep, Bash, AskUserQuestion, Skill'
          },
          { key: 'disallowedTools', value: 'Write, Edit' }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-analyzer.md',
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'mode', value: 'subagent' },
          { key: 'hidden', value: true },
          { key: 'temperature', value: 0.1 },
          {
            key: 'permission',
            value: {
              read: 'allow',
              write: 'deny',
              edit: 'deny',
              glob: 'allow',
              grep: 'allow',
              skill: 'allow',
              bash: {
                '*': 'allow',
                'npx -y mcp-sketch *': 'allow',
                'unzip *': 'deny'
              },
              question: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchArchitectPrompt,
    name: 'sketch-architect',
    description: '架构师，调用技能和工具完成组件布局工作',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-architect.md',
        meta: [
          { key: 'name' },
          { key: 'description' },
          {
            key: 'tools',
            value: 'Read, Write, Edit, Glob, Grep, Bash, Skill'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-architect.md',
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'mode', value: 'subagent' },
          { key: 'hidden', value: true },
          { key: 'temperature', value: 0.1 },
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
    prompt: SketchDeveloperPrompt,
    name: 'sketch-developer',
    description: '开发工程师，调用技能和工具完成组件绘制、修复工作',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-developer.md',
        meta: [
          { key: 'name' },
          { key: 'description' },
          {
            key: 'tools',
            value: 'Read, Write, Edit, Glob, Grep, Bash, Skill, AskUserQuestion'
          }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-developer.md',
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'mode', value: 'subagent' },
          { key: 'hidden', value: true },
          { key: 'temperature', value: 0.1 },
          {
            key: 'permission',
            value: {
              read: 'allow',
              write: 'allow',
              edit: 'allow',
              glob: 'allow',
              grep: 'allow',
              skill: 'allow',
              bash: {
                '*': 'allow',
                'npx -y mcp-sketch *': 'allow',
                'unzip *': 'deny'
              },
              question: 'allow'
            }
          }
        ]
      }
    ]
  },
  {
    prompt: SketchCheckerPrompt,
    name: 'sketch-checker',
    description: '审核专员，调用技能和工具完成组件审核工作',
    platforms: [
      {
        agent: 'claude',
        baseDir: '.claude/agents',
        fileName: 'sketch-checker.md',
        meta: [
          { key: 'name' },
          { key: 'description' },
          {
            key: 'tools',
            value: 'Read, Glob, Grep, Bash, Skill, AskUserQuestion'
          },
          { key: 'disallowedTools', value: 'Write, Edit' }
        ]
      },
      {
        agent: 'opencode',
        baseDir: '.opencode/agents',
        fileName: 'sketch-checker.md',
        meta: [
          { key: 'name' },
          { key: 'description' },
          { key: 'mode', value: 'subagent' },
          { key: 'hidden', value: true },
          { key: 'temperature', value: 0.1 },
          {
            key: 'permission',
            value: {
              read: 'allow',
              glob: 'allow',
              grep: 'allow',
              bash: 'allow',
              skill: 'allow',
              write: 'deny',
              edit: 'deny',
              question: 'allow'
            }
          }
        ]
      }
    ]
  }
]
