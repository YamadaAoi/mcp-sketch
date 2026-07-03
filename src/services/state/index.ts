import { mkdir, readFile, writeFile, rm } from 'fs/promises'
import { dirname, resolve } from 'path'
import { z } from 'zod/v4'
import { fileExists } from '@/utils/saveFile'

export const sketchStateInputSchema = z.object({
  page_name: z.string().describe('page name'),
  artboard_name: z.string().describe('artboard name'),
  content: z.string().describe('JSON content to create or update'),
  clean: z.boolean().describe('just delete component & md files'),
  replace: z.boolean().describe('replace component list, instead of merge'),
  projectPath: z.string().describe('Project path').optional()
})

export type SketchStateInputSchema = z.infer<typeof sketchStateInputSchema>

export interface ArtboardState {
  filePath: string
  previewPath: string
  previewUrl: string
  pageName: string
  artboardName: string
  width: number
  height: number
  stage: string
  components: ComponentState[]
  lastUpdateTime: string
}

export interface ComponentState {
  componentPath: string
  type?: 'page' | 'common' | 'page-specific'
  status?: string
  children?: string[]
  rect?: [number, number, number, number]
  excludeRects?: Array<[number, number, number, number]>
}

/**
 * 获取默认状态
 * @param pageName
 * @param artboardName
 * @returns 默认状态
 */
function getDefaultState(
  pageName: string,
  artboardName: string
): ArtboardState {
  return {
    filePath: '',
    previewPath: '',
    previewUrl: '',
    pageName,
    artboardName,
    width: 0,
    height: 0,
    stage: 'picked',
    components: [],
    lastUpdateTime: new Date().toISOString()
  }
}

/**
 * 解析状态
 * @param contentStr - 内容字符串
 * @returns 状态
 */
function parseState(contentStr: string) {
  try {
    return JSON.parse(contentStr) as ArtboardState
  } catch {
    throw new Error('State file not valid')
  }
}

/**
 * 读取状态
 * @param filePath
 * @returns 状态
 */
async function readState(filePath: string) {
  if (!(await fileExists(filePath))) {
    return undefined
  }
  return parseState(await readFile(filePath, 'utf-8'))
}

/**
 * 写入状态
 * @param filePath
 * @param state
 */
async function writeState(filePath: string, state: ArtboardState) {
  const dir = dirname(filePath)
  if (!(await fileExists(dir))) {
    await mkdir(dir, { recursive: true })
  }
  await writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8')
}

/**
 * 合并组件列表
 * @param existing - 存在的组件列表
 * @param incoming - 新入的组件列表
 * @param replace - 是否替换组件列表
 * @returns 合并后的组件列表
 */
function mergeComponents(
  existing: ComponentState[],
  incoming: ComponentState[],
  replace: boolean
) {
  if (replace) {
    return incoming ?? []
  }

  const map = new Map((existing ?? []).map(c => [c.componentPath, c]))
  for (const item of incoming ?? []) {
    const existingItem = map.get(item.componentPath)
    if (existingItem) {
      map.set(item.componentPath, { ...existingItem, ...item })
    } else {
      map.set(item.componentPath, item)
    }
  }
  return Array.from(map.values())
}

/**
 * 合并状态
 * @param existing - 存在的状态
 * @param incoming - 新入的状态
 * @param replace - 是否替换组件列表
 * @returns 合并后的状态
 */
function mergeState(
  existing: ArtboardState,
  incoming: ArtboardState,
  replace: boolean
) {
  const { components: existingComponents, ...existingRest } = existing
  const { components: incomingComponents, ...incomingRest } = incoming

  const merged: ArtboardState = {
    ...existingRest,
    ...incomingRest,
    components: mergeComponents(existingComponents, incomingComponents, replace)
  }

  merged.lastUpdateTime = new Date().toISOString()
  return merged
}

async function deleteComponentFolder(
  projectRoot: string,
  componentPath: string
) {
  const folder = resolve(projectRoot, dirname(componentPath))
  if (await fileExists(folder)) {
    await rm(folder, { recursive: true, force: true })
  }
}

async function deleteComponentFiles(
  projectRoot: string,
  components: ComponentState[]
) {
  for (const comp of components) {
    if (comp.type === 'page-specific' || comp.type === 'common') {
      await deleteComponentFolder(projectRoot, comp.componentPath)
    }
  }
  for (const comp of components) {
    if (comp.type === 'page') {
      await deleteComponentFolder(projectRoot, comp.componentPath)
    }
  }
}

export async function sketchState(args: SketchStateInputSchema) {
  let response = 'Sketch Exception'

  try {
    const { page_name, artboard_name, clean, replace, content, projectPath } =
      args

    const projPath = projectPath ? resolve(projectPath) : process.cwd()
    const absPath = resolve(
      projPath,
      `.sketch-cache/artboards/${page_name}-${artboard_name}.json`
    )
    const newContent = parseState(content)
    let oldContent = await readState(absPath)

    if (clean && oldContent?.components?.length) {
      await deleteComponentFiles(projPath, oldContent.components)
    }

    if (!oldContent) {
      oldContent = getDefaultState(page_name, artboard_name)
    }

    const merged = mergeState(oldContent, newContent, replace)

    await writeState(absPath, merged)

    response = `✅ RECORD_SUCCESS`
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
