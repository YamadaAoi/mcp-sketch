import { readFile } from 'fs/promises'
import { basename, isAbsolute, relative, resolve } from 'path'
import { load } from 'js-yaml'
import { z } from 'zod/v4'
import { fileExists, writeJsonFile } from '@/utils/saveFile'
import { getEnv } from '@/utils/env'

function toRelativePath(absOrRelative: string, cwd: string): string {
  return isAbsolute(absOrRelative)
    ? relative(cwd, absOrRelative)
    : absOrRelative
}

export const sketchStateInputSchema = z.object({
  file_path: z.string().describe('design file path'),
  page_name: z.string().describe('page name'),
  artboard_name: z.string().describe('artboard name'),
  content: z.string().describe('Content data in YAML flow mapping format'),
  replace: z.boolean().describe('replace component list, instead of merge')
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
  components: ComponentState[]
  lastUpdateTime: string
  targetPage?: string
}

export interface ComponentState {
  componentPath: string
  type?: 'page' | 'common' | 'page-specific'
  status?: ComponentStatus
  children?: string[]
  rect?: [number, number, number, number]
  excludeRects?: Array<[number, number, number, number]>
}

export type ComponentStatus =
  | 'split-done'
  | 'split-check-done'
  | 'gen-base-done'
  | 'gen-base-check-done'
  | 'layout-done'
  | 'layout-check-done'
  | 'draw-done'
  | 'draw-check-done'

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
    return load(contentStr, { json: true }) as ArtboardState
  } catch {
    throw new Error('State file not valid')
  }
}

/**
 * 获取状态文件路径
 * @param file_path - 设计文件路径
 * @param page_name - 页面名称
 * @param artboard_name - 艺术板名称
 * @returns 状态文件路径
 */
export function getStatePath(
  file_path: string,
  page_name: string,
  artboard_name: string
) {
  const designFileName = basename(file_path, '.zip')
  return resolve(
    getEnv('CWD'),
    `.sketch-cache/artboards/${designFileName}/${page_name}/${artboard_name}/progress.json`
  )
}

/**
 * 读取状态
 * @param filePath
 * @returns 状态
 */
export async function readState(filePath: string) {
  if (!(await fileExists(filePath))) {
    return undefined
  }
  const contentStr = await readFile(filePath, 'utf-8')
  try {
    return JSON.parse(contentStr) as ArtboardState
  } catch {
    throw new Error('State file not valid')
  }
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
  replace: boolean,
  cwd: string
) {
  const { components: existingComponents, ...existingRest } = existing
  const { components: incomingComponents, ...incomingRest } = incoming

  if (incomingRest.filePath) {
    incomingRest.filePath = toRelativePath(incomingRest.filePath, cwd)
  }
  if (incomingRest.previewPath) {
    incomingRest.previewPath = toRelativePath(incomingRest.previewPath, cwd)
  }
  if (incomingRest.targetPage) {
    incomingRest.targetPage = toRelativePath(incomingRest.targetPage, cwd)
  }
  if (incomingComponents?.length) {
    for (const comp of incomingComponents) {
      if (comp.componentPath) {
        comp.componentPath = toRelativePath(comp.componentPath, cwd)
      }
    }
  }

  const merged: ArtboardState = {
    ...existingRest,
    ...incomingRest,
    components: mergeComponents(existingComponents, incomingComponents, replace)
  }

  merged.lastUpdateTime = new Date().toISOString()
  return merged
}

export async function sketchState(args: SketchStateInputSchema) {
  let response = 'Sketch Exception'

  try {
    const cwd = getEnv('CWD')
    const { file_path, page_name, artboard_name, replace, content } = args

    const absPath = getStatePath(file_path, page_name, artboard_name)
    const newContent = parseState(content)
    let oldContent = await readState(absPath)

    if (!oldContent) {
      oldContent = getDefaultState(page_name, artboard_name)
    }

    const merged = mergeState(oldContent, newContent, replace, cwd)

    await writeJsonFile(absPath, merged)

    response = `✅ RECORD_SUCCESS`
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
