import path from 'path'
import fs from 'fs/promises'
import prompts from 'prompts'

interface Meta {
  key: string
  value?: string | number | boolean | Record<string, unknown>
}

interface Platform {
  agent: 'claude' | 'opencode'
  baseDir: string
  fileName: string
  isNested?: boolean
  meta: Meta[]
}

export interface InstallConfig {
  name: string
  description: string
  prompt: string
  platforms: Platform[]
}

type MetaParam = keyof Omit<InstallConfig, 'prompt' | 'platforms'>

export function generateFrontmatter(meta: Meta[]): string {
  const lines = meta.map(item => {
    if (typeof item.value === 'object' && item.value !== null) {
      const nestedLines = Object.entries(item.value).map(([subKey, subVal]) => {
        if (typeof subVal === 'object' && subVal !== null) {
          const deeperLines = Object.entries(subVal).map(
            ([deepKey, deepVal]) => `    ${deepKey}: ${deepVal}`
          )
          return `  ${subKey}:\n${deeperLines.join('\n')}`
        }
        return `  ${subKey}: ${subVal as string | number | boolean}`
      })
      return `${item.key}:\n${nestedLines.join('\n')}`
    }
    return `${item.key}: ${item.value}`
  })

  return `---\n${lines.join('\n')}\n---`
}

function getTargetPath(
  cwd: string,
  config: InstallConfig,
  platform: string
): string | null {
  const cur = config.platforms.find(p => p.agent === platform)
  if (!cur) return null

  const targetDir = cur.isNested
    ? path.join(cwd, cur.baseDir, config.name)
    : path.join(cwd, cur.baseDir)

  return path.join(targetDir, cur.fileName)
}

async function installByPlatform(
  cwd: string,
  config: InstallConfig,
  platform: string
) {
  const cur = config.platforms.find(p => p.agent === platform)
  if (!cur) return

  let targetDir: string

  if (cur.isNested) {
    // .claude/skills/{name}/SKILL.md
    targetDir = path.join(cwd, cur.baseDir, config.name)
  } else {
    // .claude/agents/{name}.md
    targetDir = path.join(cwd, cur.baseDir)
  }

  await fs.mkdir(targetDir, { recursive: true })

  const newMeta = cur.meta.map(m => ({
    ...m,
    value: m.value ?? config[m.key as MetaParam] ?? ''
  }))

  const frontmatter = generateFrontmatter(newMeta)
  const fileContent = `${frontmatter}\n\n${config.prompt}`

  await fs.writeFile(path.join(targetDir, cur.fileName), fileContent, 'utf8')
}

async function checkConflicts(
  cwd: string,
  platform: string,
  pool: InstallConfig[]
): Promise<InstallConfig[]> {
  const conflicts: InstallConfig[] = []
  for (const config of pool) {
    const target = getTargetPath(cwd, config, platform)
    if (!target) continue
    try {
      await fs.access(target)
      conflicts.push(config)
    } catch {
      // 文件不存在，无冲突
    }
  }
  return conflicts
}

export async function install(
  cwd: string,
  platform: string,
  pool: InstallConfig[]
) {
  const conflicts = await checkConflicts(cwd, platform, pool)

  let poolToInstall = pool

  if (conflicts.length > 0) {
    const names = conflicts.map(c => c.name).join(', ')
    const result = await prompts({
      type: 'select',
      name: 'action',
      message: `Files already exist: ${names}`,
      hint: '↑/↓ to navigate, enter to select',
      choices: [
        { title: 'Overwrite all', value: 'overwrite' },
        { title: 'Skip all', value: 'skip' },
        { title: 'Choose each', value: 'each' }
      ]
    })

    if (result.action === 'overwrite') {
      poolToInstall = pool
    } else if (result.action === 'skip') {
      poolToInstall = pool.filter(c => !conflicts.includes(c))
    } else if (result.action === 'each') {
      const keep: InstallConfig[] = []
      for (const config of pool) {
        const isConflict = conflicts.includes(config)
        if (!isConflict) {
          keep.push(config)
          continue
        }
        const r = await prompts({
          type: 'confirm',
          name: 'overwrite',
          message: `Overwrite ${config.name}?`,
          initial: false
        })
        if (r.overwrite) keep.push(config)
      }
      poolToInstall = keep
    } else {
      // 用户中断选择，退出
      return
    }
  }

  const promises = poolToInstall.map(p => installByPlatform(cwd, p, platform))
  await Promise.all(promises)
}
