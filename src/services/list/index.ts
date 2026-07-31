import { readFile } from 'fs/promises'
import { basename, resolve } from 'path'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { openSketchHtmlFile } from '@/utils/zip'
import { fileExists, isFileNewerThan, writeJsonFile } from '@/utils/saveFile'
import { getEnv } from '@/utils/env'

export const sketchListInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)'),
  persist: z
    .boolean()
    .default(false)
    .describe('persist the result to file or not (default: false)')
})

export type SketchListInputSchema = SchemaOutput<typeof sketchListInputSchema>

function getListPath(filePath: string) {
  const designFileName = basename(filePath, '.zip')
  return resolve(
    getEnv('CWD'),
    `.sketch-cache/artboards/${designFileName}/list.json`
  )
}

/**
 * 获取sketch html文件中的所有artboard列表
 * @param args 输入参数
 * @param args.file_path sketch html文件路径
 * @returns 输出参数，包含所有artboard的列表
 */
export async function sketchList(args: SketchListInputSchema) {
  let response = 'Sketch Exception'

  try {
    const listPath = getListPath(args.file_path)
    const cached =
      (await fileExists(listPath)) &&
      (await isFileNewerThan(listPath, args.file_path))

    if (args.persist && cached) {
      response = `artboard list saved to ${listPath}.`
      return response
    }

    if (cached) {
      const content = await readFile(listPath, 'utf-8')
      response = JSON.stringify(JSON.parse(content))
      return response
    }

    const sketchData = await openSketchHtmlFile(args.file_path)
    const list =
      sketchData?.data?.artboards?.map(a => {
        return {
          pageName: a.pageName,
          artboardName: a.name
        }
      }) ?? []
    if (args.persist) {
      await writeJsonFile(listPath, list)
      response = `artboard list saved to ${listPath}.`
    } else {
      response = JSON.stringify(list)
    }
  } catch (error) {
    response = `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
