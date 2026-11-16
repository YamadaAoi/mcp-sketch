import fs from 'fs/promises'
import path from 'path'
import { fileExists, writeJsonFile } from './saveFile'
import { getEnv } from './env'

/**
 * 切图溯源：拼音文件名 → 原始导出文件名与图层/页面/画板名
 * （同内容去重后一个文件可对应多个图层，故为列表）
 */
export interface AssetNameOrigin {
  /** 转写为拼音前的原始导出文件名（含扩展名，如 "编组 7.png"） */
  name: string
  page: string
  artboard: string
  layer: string
}

/**
 * 切图内容哈希索引，持久化在 .sketch-cache/assets-index.json：
 * - v2 结构：{ v: 2, scopes: { 资产输出目录（相对 CWD）: { 内容哈希: 文件路径（相对 CWD）} }, names: { 文件路径: AssetNameOrigin[] } }
 * - scopes 用于跨画板/跨会话的全局去重
 * - names 为拼音文件名的溯源（切图命名常为 `bian-zu-7.webp` 这类无语义拼音）：
 *   { 文件路径: [{ name: 原始导出文件名（如 "编组 7.png"）, page, artboard, layer }] }
 * - 存相对路径以保证项目目录挪动/跨机器后索引依然有效；索引丢失（如清除缓存）时由写入侧通过同名文件内容比对自愈
 * - 旧版结构（{ 目录: { 哈希: 路径 } }，无 v 字段）读取时自动迁移：保留去重历史，names 从空开始收集
 */
interface AssetIndexFile {
  v: 2
  scopes: Record<string, Record<string, string>>
  names: Record<string, AssetNameOrigin[]>
}

const INDEX_FILE = 'assets-index.json'

let cachedIndex: AssetIndexFile | undefined

function indexPath() {
  return path.resolve(getEnv('CWD'), '.sketch-cache', INDEX_FILE)
}

function toRelative(p: string) {
  return path.relative(getEnv('CWD'), path.resolve(getEnv('CWD'), p))
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function emptyIndex(): AssetIndexFile {
  return { v: 2, scopes: {}, names: {} }
}

/** 旧版索引迁移为 v2：顶层各目录键收入 scopes，names 从空开始收集 */
function migrateLegacy(parsed: unknown): AssetIndexFile {
  if (!isPlainObject(parsed)) return emptyIndex()
  const index = emptyIndex()
  for (const [dir, hashes] of Object.entries(parsed)) {
    if (isPlainObject(hashes)) {
      index.scopes[dir] = hashes as Record<string, string>
    }
  }
  return index
}

async function loadIndex(): Promise<AssetIndexFile> {
  if (cachedIndex) return cachedIndex
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(indexPath(), 'utf8'))
    if (isPlainObject(parsed) && parsed.v === 2) {
      cachedIndex = {
        v: 2,
        scopes: isPlainObject(parsed.scopes)
          ? (parsed.scopes as AssetIndexFile['scopes'])
          : {},
        names: isPlainObject(parsed.names)
          ? (parsed.names as AssetIndexFile['names'])
          : {}
      }
    } else {
      cachedIndex = migrateLegacy(parsed)
    }
  } catch {
    cachedIndex = emptyIndex()
  }
  return cachedIndex
}

/**
 * 记录 文件路径 → 原始图层名 溯源（同一来源不重复记录）
 * @returns 是否有变更（无变更时调用方可跳过落盘）
 */
function recordName(
  index: AssetIndexFile,
  filePath: string,
  origin: AssetNameOrigin
): boolean {
  const key = toRelative(filePath)
  const list = (index.names[key] ??= [])
  const exists = list.some(
    n =>
      n.name === origin.name &&
      n.page === origin.page &&
      n.artboard === origin.artboard &&
      n.layer === origin.layer
  )
  if (exists) return false
  list.push(origin)
  return true
}

/**
 * 查询同内容切图是否已存在
 * @returns 已存在文件的相对路径（相对 CWD），不存在时返回 undefined
 */
export async function getExistingAssetPath(
  hash: string,
  assetsPath: string
): Promise<string | undefined> {
  const index = await loadIndex()
  const p = index.scopes[toRelative(assetsPath)]?.[hash]
  if (p && (await fileExists(path.resolve(getEnv('CWD'), p)))) return p
  return undefined
}

/**
 * 登记新写入的切图（内容哈希 → 文件相对路径，按资产输出目录分作用域），可同时记录名称溯源
 */
export async function registerAsset(
  hash: string,
  assetsPath: string,
  filePath: string,
  origin?: AssetNameOrigin
) {
  const index = await loadIndex()
  const dir = toRelative(assetsPath)
  index.scopes[dir] ??= {}
  index.scopes[dir][hash] = toRelative(filePath)
  if (origin) recordName(index, filePath, origin)
  await writeJsonFile(indexPath(), index)
}

/** 去重复用已有文件时，补记本次的图层名溯源 */
export async function registerAssetName(
  filePath: string,
  origin: AssetNameOrigin
) {
  const index = await loadIndex()
  if (!recordName(index, filePath, origin)) return
  await writeJsonFile(indexPath(), index)
}
