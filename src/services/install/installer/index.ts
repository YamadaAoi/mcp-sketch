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
  meta: Meta[]
}

export interface InstallConfig {
  name: string
  description: string
  prompt: string
  references?: Record<string, string>
  platforms: Platform[]
}

type MetaParam = keyof Omit<InstallConfig, 'prompt' | 'platforms'>

function needsQuoting(val: string): boolean {
  return /[*&!|>%@`#{\['":\s]/.test(val)
}

function quoteKey(key: string): string {
  return needsQuoting(key) ? `"${key}"` : key
}

function generateFrontmatter(meta: Meta[]): string {
  const lines = meta.map(item => {
    if (typeof item.value === 'object' && item.value !== null) {
      const nestedLines = Object.entries(item.value).map(([subKey, subVal]) => {
        if (typeof subVal === 'object' && subVal !== null) {
          const deeperLines = Object.entries(subVal).map(
            ([deepKey, deepVal]) => `    ${quoteKey(deepKey)}: ${deepVal}`
          )
          return `  ${quoteKey(subKey)}:\n${deeperLines.join('\n')}`
        }
        return `  ${quoteKey(subKey)}: ${subVal as string | number | boolean}`
      })
      return `${item.key}:\n${nestedLines.join('\n')}`
    }
    return `${item.key}: ${item.value ?? ''}`
  })

  return `---\n${lines.join('\n')}\n---`
}

function getTargetDir(
  cwd: string,
  config: InstallConfig,
  platform: Platform
): string {
  // .claude/skills/{name}/SKILL.md
  return path.join(cwd, platform.baseDir, config.name)
}

function getReferenceTargets(
  targetDir: string,
  config: InstallConfig
): { target: string; content: string }[] {
  const refDir = path.join(targetDir, 'references')
  return Object.entries(config.references ?? {})
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([name, content]) => ({
      target: path.join(refDir, `${name}.md`),
      content
    }))
}

function getTargetPaths(
  cwd: string,
  config: InstallConfig,
  platform: string
): string[] {
  const cur = config.platforms.find(p => p.agent === platform)
  if (!cur) return []

  const targetDir = getTargetDir(cwd, config, cur)
  const mainPath = path.join(targetDir, cur.fileName)
  return [
    mainPath,
    ...getReferenceTargets(targetDir, config).map(r => r.target)
  ]
}

async function installByPlatform(
  cwd: string,
  config: InstallConfig,
  platform: string,
  skipFiles?: Set<string>
) {
  const cur = config.platforms.find(p => p.agent === platform)
  if (!cur) return

  const targetDir = getTargetDir(cwd, config, cur)
  const mainPath = path.join(targetDir, cur.fileName)
  const refs = getReferenceTargets(targetDir, config).filter(
    r => !skipFiles?.has(r.target)
  )

  const skipMain = skipFiles?.has(mainPath) ?? false
  if (skipMain && refs.length === 0) return

  await fs.mkdir(targetDir, { recursive: true })

  if (!skipMain) {
    const newMeta = cur.meta.map(m => ({
      ...m,
      value: m.value ?? config[m.key as MetaParam] ?? ''
    }))

    const frontmatter = generateFrontmatter(newMeta)
    const fileContent = `${frontmatter}\n\n${config.prompt}`

    await fs.writeFile(mainPath, fileContent, 'utf8')
  }

  if (refs.length) {
    const refDir = path.join(targetDir, 'references')
    await fs.mkdir(refDir, { recursive: true })

    await Promise.all(refs.map(r => fs.writeFile(r.target, r.content, 'utf8')))
  }
}

interface ConflictResult {
  config: InstallConfig
  files: string[]
}

async function checkConflicts(
  cwd: string,
  platform: string,
  pool: InstallConfig[]
): Promise<ConflictResult[]> {
  const conflicts: ConflictResult[] = []
  for (const config of pool) {
    const files: string[] = []
    for (const target of getTargetPaths(cwd, config, platform)) {
      try {
        await fs.access(target)
        files.push(target)
      } catch {
        // 文件不存在，无冲突
      }
    }
    if (files.length > 0) conflicts.push({ config, files })
  }
  return conflicts
}

export async function install(
  cwd: string,
  platform: string,
  pool: InstallConfig[]
) {
  const conflicts = await checkConflicts(cwd, platform, pool)

  const skipFiles = new Map<InstallConfig, Set<string>>()

  if (conflicts.length > 0) {
    const names = conflicts
      .flatMap(c => c.files.map(f => path.relative(cwd, f)))
      .join(', ')
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
      // 覆盖所有冲突文件
    } else if (result.action === 'skip') {
      for (const c of conflicts) skipFiles.set(c.config, new Set(c.files))
    } else if (result.action === 'each') {
      for (const c of conflicts) {
        const skip = new Set<string>()
        for (const file of c.files) {
          const r = await prompts({
            type: 'confirm',
            name: 'overwrite',
            message: `Overwrite ${path.relative(cwd, file)}?`,
            initial: false
          })
          if (!r.overwrite) skip.add(file)
        }
        skipFiles.set(c.config, skip)
      }
    } else {
      // 用户中断选择，退出
      return
    }
  }

  const promises = pool.map(p =>
    installByPlatform(cwd, p, platform, skipFiles.get(p))
  )
  await Promise.all(promises)
}
