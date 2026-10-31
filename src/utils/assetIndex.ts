import fs from 'fs/promises'
import path from 'path'
import { fileExists, writeJsonFile } from './saveFile'
import { getEnv } from './env'

/**
 * 切图内容哈希索引：{ 资产输出目录（相对 CWD）: { 内容哈希: 文件路径（相对 CWD）} }
 * 持久化在 .sketch-cache/assets-index.json，用于跨画板/跨会话的全局去重
 * 存相对路径以保证项目目录挪动/跨机器后索引依然有效；索引丢失（如清除缓存）时由写入侧通过同名文件内容比对自愈
 */
type AssetIndexFile = Record<string, Record<string, string>>

const INDEX_FILE = 'assets-index.json'

let cachedIndex: AssetIndexFile | undefined

function indexPath() {
  return path.resolve(getEnv('CWD'), '.sketch-cache', INDEX_FILE)
}

function toRelative(p: string) {
  return path.relative(getEnv('CWD'), path.resolve(getEnv('CWD'), p))
}

async function loadIndex(): Promise<AssetIndexFile> {
  if (cachedIndex) return cachedIndex
  try {
    cachedIndex = JSON.parse(
      await fs.readFile(indexPath(), 'utf8')
    ) as AssetIndexFile
  } catch {
    cachedIndex = {}
  }
  return cachedIndex
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
  const p = index[toRelative(assetsPath)]?.[hash]
  if (p && (await fileExists(path.resolve(getEnv('CWD'), p)))) return p
  return undefined
}

/**
 * 登记新写入的切图（内容哈希 → 文件相对路径），按资产输出目录分作用域
 */
export async function registerAsset(
  hash: string,
  assetsPath: string,
  filePath: string
) {
  const index = await loadIndex()
  const dir = toRelative(assetsPath)
  index[dir] ??= {}
  index[dir][hash] = toRelative(filePath)
  await writeJsonFile(indexPath(), index)
}
