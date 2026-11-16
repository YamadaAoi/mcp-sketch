import path from 'path'
import fs from 'fs/promises'
import { createHash } from 'node:crypto'
import { getEnv } from '@/utils/env'
import { logger } from '@/utils/logger'
import { writeJsonFile } from '@/utils/saveFile'
import { LAYER_COLUMNS } from './assembleArtboard'

/**
 * analyze 结果的落盘缓存（CLI 与 MCP 共用同一份）
 * - 位置：.sketch-cache/{design}/analyze/{page}--{artboard}--{params}--{hash8}.json
 * - 键：完整分析参数（页面/画板/rect/exclude/name/type/limit/offset/生效的切图目录）
 * - 失效：设计稿版本戳（zip 文件 mtime / 目录内部最新 mtime）不一致，或输出结构版本、列序变化
 * - 命中校验：响应引用的文件（预览图与全部切图）必须仍存在，缺失时放弃缓存走重算路径
 *   （切图目录被清理的场景由此触发自愈重导出）
 * 设计稿解析层另有进程内缓存（zip.ts 的 sketchMemo），供同会话内不同参数组合共享一次解析，两层互补
 */

/** 缓存结构版本：analyze 输出结构变化时递增，旧缓存整体失效 */
const ANALYZE_CACHE_VERSION = 1

const ASSETS_COL = LAYER_COLUMNS.indexOf('assets')

export interface AnalyzeCacheKey {
  /** 页面名参数（原样参与键计算；支持模糊匹配的不同写法各自成缓存文件，内容相同仅多占一处） */
  page_name: string
  artboard_name: string
  rect?: [number, number, number, number]
  exclude_rects?: [number, number, number, number][]
  name?: string
  type?: 'text' | 'shape' | 'slice'
  limit?: number
  offset?: number
  /** 实际生效的切图输出目录（参数优先，缺省取 ASSETS_PATH）——影响输出中的切图路径 */
  assets_path: string
}

interface AnalyzeCacheFile {
  v: number
  /** 设计稿版本戳，与当前 getDesignStamp 结果比对，不一致即失效 */
  stamp: number
  /** 完整参数键（排查用；文件名只含页面/画板/rect 等查询身份段，唯一性以文件名 hash 为准） */
  key?: AnalyzeCacheKey
  response: Record<string, unknown>
}

/** 文件名安全片段：替换路径非法字符与分隔符（不截断，长度统一由字节预算控制） */
function slug(s: string): string {
  const cleaned = s
    .trim()
    .replace(/[\\/:*?"<>|\s,;=+#-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return cleaned || 'x'
}

function rectPart(r: [number, number, number, number]): string {
  return r.map(n => `${Math.round(n)}`).join('_')
}

/**
 * 可读名总预算（UTF-8 字节）：最终文件名 < 200 字符（Windows 长路径护栏）
 * 且 < 255 字节（unix 单文件名上限）
 */
const NAME_BYTE_BUDGET = 180

/** 按字节截断，按码点迭代不切断代理对 */
function truncateBytes(s: string, maxBytes: number): string {
  let out = ''
  let used = 0
  for (const ch of s) {
    used += Buffer.byteLength(ch)
    if (used > maxBytes) break
    out += ch
  }
  return out
}

/**
 * 缓存文件路径：文件名带可读的参数摘要（人可直接辨认），hash8 由完整参数键计算保证唯一
 * 可读段不预设各段长度上限——完整组装后统一限长：头部（页面/画板名）必留，
 * 参数段按 r/n/t/l/o 顺序逐段装入字节预算，装不下的整段丢弃并以 `+` 标记
 * （不截出 r695_2 这类误导性半段），完整参数键记录在缓存文件内容的 key 字段里
 *
 * exclude_rects 不进文件名：数量不可控（渐进绘制逐组件追加），且属会话进度状态而非查询身份，
 * 只参与 hash 与文件内 key——命中比对本就只看 hash，可读段重名由 hash 自然区分
 */
export function getAnalyzeCachePath(
  filePath: string,
  key: AnalyzeCacheKey
): string {
  const design = path.basename(filePath, '.zip')
  const hash = createHash('sha256')
    .update(JSON.stringify(key))
    .digest('hex')
    .slice(0, 8)

  const parts: string[] = []
  if (key.rect) parts.push(`r${rectPart(key.rect)}`)
  if (key.name) parts.push(`n${slug(key.name)}`)
  if (key.type) parts.push(`t${key.type}`)
  if (key.limit !== undefined) parts.push(`l${key.limit}`)
  if (key.offset !== undefined) parts.push(`o${key.offset}`)

  // head 必留（预算内完整保留，自身超长才按字节硬截）；参数段逐段装入，装不下的整段丢弃
  const head = `${slug(key.page_name)}--${slug(key.artboard_name)}`
  const fitted: string[] = []
  let used = Buffer.byteLength(head) + '--'.length
  let dropped = false
  for (const p of parts) {
    const cost = Buffer.byteLength(p) + (fitted.length ? '_'.length : 0)
    if (used + cost > NAME_BYTE_BUDGET) {
      dropped = true
      break
    }
    fitted.push(p)
    used += cost
  }

  const segments = [head]
  if (fitted.length) segments.push(fitted.join('_'))
  else if (!dropped) segments.push('all')
  let readable = segments.join('--')
  if (dropped) readable += '+'
  readable = truncateBytes(readable, NAME_BYTE_BUDGET)

  return path.resolve(
    getEnv('CWD'),
    '.sketch-cache',
    design,
    'analyze',
    `${readable}--${hash}.json`
  )
}

/** 收集响应中引用的全部文件路径：预览图 + 各行（含 adjacent）的切图 */
function toRows(v: unknown): unknown[][] {
  return Array.isArray(v)
    ? v.filter((r): r is unknown[] => Array.isArray(r))
    : []
}

function collectReferencedPaths(res: Record<string, unknown>): string[] {
  const out: string[] = []
  if (typeof res.previewPath === 'string') out.push(res.previewPath)

  const rows = [...toRows(res.layers), ...toRows(res.adjacent)]
  for (const row of rows) {
    const cell = row[ASSETS_COL]
    if (Array.isArray(cell)) {
      for (const p of cell) {
        if (typeof p === 'string') out.push(p)
      }
    }
  }
  return out
}

async function exists(abs: string) {
  try {
    await fs.access(abs)
    return true
  } catch {
    return false
  }
}

/**
 * 读取缓存并校验：结构版本、设计稿版本戳、列序一致，且引用的文件仍然存在
 * @returns 命中返回缓存响应对象，未命中返回 null（调用方走重算路径）
 */
export async function readAnalyzeCache(
  cachePath: string,
  stamp: number | undefined
): Promise<Record<string, unknown> | null> {
  if (stamp === undefined) return null

  let entry: AnalyzeCacheFile
  try {
    entry = JSON.parse(await fs.readFile(cachePath, 'utf8')) as AnalyzeCacheFile
  } catch {
    return null
  }
  if (
    entry?.v !== ANALYZE_CACHE_VERSION ||
    entry.stamp !== stamp ||
    !entry.response ||
    typeof entry.response !== 'object'
  ) {
    return null
  }

  const res = entry.response
  if (JSON.stringify(res.columns) !== JSON.stringify(LAYER_COLUMNS)) {
    return null
  }

  const cwd = getEnv('CWD')
  for (const rel of collectReferencedPaths(res)) {
    if (!(await exists(path.resolve(cwd, rel)))) return null
  }
  return res
}

/** 写入缓存；失败仅告警，不影响 analyze 正常返回（缓存目录被占用等场景） */
export async function writeAnalyzeCache(
  cachePath: string,
  stamp: number | undefined,
  key: AnalyzeCacheKey,
  response: Record<string, unknown>
) {
  if (stamp === undefined) return
  const entry: AnalyzeCacheFile = {
    v: ANALYZE_CACHE_VERSION,
    stamp,
    key,
    response
  }
  try {
    await writeJsonFile(cachePath, entry)
  } catch (e) {
    logger.warn(`analyze 缓存写入失败: ${cachePath} (${(e as Error).message})`)
  }
}
