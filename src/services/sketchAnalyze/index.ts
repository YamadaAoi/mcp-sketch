import path from 'path'
import fs from 'fs/promises'
import { openSketchFile } from '@/utils/zip'
import { logger } from '@/utils/logger'
import { resolveArtboardTarget } from './resolveArtboardTarget'
import { assembleNode } from './assembleNode'
import type { InputSchema, Structure } from '@/types'

/**
 * 写入json文件，若文件夹不存在则创建，文件存在则覆盖
 * @param filePath - json文件路径
 * @param data - 要写入的数据
 */
async function writeJsonFile(filePath: string, data: Structure[]) {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  const jsonString = JSON.stringify(data)
  await fs.writeFile(filePath, jsonString, 'utf8')
}

/**
 * 分析sketch文件，提取指定节点数据，存储到指定位置json文件中，返回json文件位置
 * json位置拼接规则：{args.file_path所在文件夹}/{args.file_name无后缀}/{nodeInfo.pageId}_{nodeInfo.artboardId}_{nodeInfo.nodeId(如果有的话)}.json
 * @param args 分析参数
 * @returns json文件位置
 */
export async function handleSketchAnalyze(args: InputSchema) {
  logger.debug(args, 'resolveArtboardTarget')
  const sketchFile = await openSketchFile(args.file_path)
  const nodeInfo = resolveArtboardTarget(args, sketchFile)
  const nodes = assembleNode(nodeInfo, args, sketchFile)
  const parsed = path.parse(args.file_path)
  const targetPath = `${parsed.dir}/${parsed.name}/${nodeInfo.pageId}_${nodeInfo.artboardId}_${nodeInfo.nodeId ? nodeInfo.nodeId : 'all'}.json`
  writeJsonFile(targetPath, nodes).catch(() => {
    logger.error(`writeJsonFile ${targetPath} error`)
  })
  return targetPath
}
