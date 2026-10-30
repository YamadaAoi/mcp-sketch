import { readFile, stat } from 'fs/promises'
import { basename, resolve } from 'path'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import {
  getDesignStamp,
  openSketchHtmlFile,
  normalize,
  type HtmlArtboard,
  type SketchImage
} from '@/utils/zip'
import { writeJsonFile } from '@/utils/saveFile'
import { getEnv } from '@/utils/env'
import {
  filterLayers,
  processPreview,
  toSketchLayer
} from '../analyze/assembleArtboard'

export const sketchListInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)')
})

export type SketchListInputSchema = SchemaOutput<typeof sketchListInputSchema>

function getListPath(filePath: string) {
  const designFileName = basename(filePath, '.zip')
  return resolve(getEnv('CWD'), `.sketch-cache/${designFileName}/list.json`)
}

async function getListInfo(
  file_path: string,
  artboard: HtmlArtboard,
  images?: SketchImage[]
) {
  const layers = filterLayers((artboard?.layers ?? []).map(toSketchLayer))
  const previewPath = await processPreview(
    {
      pageName: artboard.pageName,
      name: artboard.name,
      width: artboard.width,
      previewPath: artboard.imagePath
        ? normalize(artboard.imagePath)
        : undefined
    },
    file_path,
    undefined,
    undefined,
    images
  )
  return {
    pageName: artboard.pageName,
    artboardName: artboard.name,
    size: Buffer.byteLength(JSON.stringify(layers)),
    previewPath
  }
}

/**
 * 获取sketch html文件中的所有artboard列表，结果写入 .sketch-cache/{design}/list.json 并返回JSON
 * 设计稿（zip mtime 或目录内最新 mtime）更新后自动重新生成
 * @param args 输入参数
 * @param args.file_path sketch html文件路径
 * @returns 画板列表JSON，末尾附 list.json 落盘路径
 */
export async function sketchList(args: SketchListInputSchema) {
  const listPath = getListPath(args.file_path)
  const stamp = await getDesignStamp(args.file_path)
  const listStat = await stat(listPath).catch(() => undefined)
  const cached = stamp !== undefined && !!listStat && listStat.mtimeMs >= stamp

  let json: string
  if (cached) {
    json = await readFile(listPath, 'utf8')
  } else {
    const sketchData = await openSketchHtmlFile(args.file_path)
    const promises = (sketchData?.data?.artboards ?? []).map(a =>
      getListInfo(args.file_path, a, sketchData.images)
    )
    const list = await Promise.all(promises)
    await writeJsonFile(listPath, list)
    json = JSON.stringify(list)
  }

  return `${json}\n\nsaved to ${listPath}`
}
