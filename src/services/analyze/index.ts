import { readFile } from 'fs/promises'
import { basename, resolve } from 'path'
import { createHash } from 'node:crypto'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { openSketchHtmlFile } from '@/utils/zip'
import { fileExists, isFileNewerThan, writeJsonFile } from '@/utils/saveFile'
import { getEnv } from '@/utils/env'
import { getRect } from '@/utils/util'
import { filterArtboards } from './filterArtboards'
import {
  assembleArtboard,
  filterCachedLayers,
  processPreview
} from './assembleArtboard'

/**
 * 解析sketch html文件分析参数
 */
export const sketchAnalyzeInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)'),
  page_name: z.string().describe('page name (required)'),
  artboard_name: z.string().describe('artboard name (required)'),
  rect: z
    .array(z.number())
    .describe('rect [x, y, width, height] (optional)')
    .optional(),
  exclude_rects: z
    .array(z.array(z.number()))
    .describe('exclude rects [x, y, width, height] (optional)')
    .optional(),
  assets_path: z
    .string()
    .describe(
      'assets path (optional), default ASSETS_PATH from .env.sketch or src/assets/sketch'
    )
    .optional(),
  limit: z
    .number()
    .describe('number of top-scored layers to return (optional)')
    .optional(),
  offset: z
    .number()
    .describe('starting index in sorted layers (optional, default 0)')
    .optional(),
  persist: z
    .boolean()
    .default(false)
    .describe('persist the result to file or not (default: false)')
})

export type SketchAnalyzeInputSchema = SchemaOutput<
  typeof sketchAnalyzeInputSchema
>

function hashOfConstraints(
  rect?: number[],
  excludeRects?: number[][],
  limit?: number,
  offset?: number
): string | undefined {
  if (
    !rect?.length &&
    !excludeRects?.length &&
    limit === undefined &&
    offset === undefined
  )
    return undefined
  const key = JSON.stringify({ rect, excludeRects, limit, offset })
  return createHash('md5').update(key).digest('hex').slice(0, 8)
}

function getResultPath(
  file_path: string,
  page_name: string,
  artboard_name: string,
  hash?: string
) {
  const designFileName = basename(file_path, '.zip')
  const dir = hash
    ? `.sketch-cache/artboards/${designFileName}/${page_name}/${artboard_name}/${hash}`
    : `.sketch-cache/artboards/${designFileName}/${page_name}/${artboard_name}`
  return resolve(getEnv('CWD'), dir, 'layer.json')
}

function parseRects(
  rect?: number[],
  excludeRects?: number[][]
): {
  rect?: [number, number, number, number]
  excludeRects?: [number, number, number, number][]
} {
  return {
    rect: getRect(rect),
    excludeRects: excludeRects?.reduce<[number, number, number, number][]>(
      (acc, r) => {
        const parsed = getRect(r)
        if (parsed) acc.push(parsed)
        return acc
      },
      []
    )
  }
}

/**
 * 分析sketch html文件(zip或目录)，提取指定节点数据，返回JSON格式的artboard信息
 * @param args 分析参数
 * @returns artboard JSON字符串
 */
export async function sketchAnalyze(args: SketchAnalyzeInputSchema) {
  try {
    const { file_path, page_name, artboard_name, persist } = args
    const { rect, excludeRects } = parseRects(args.rect, args.exclude_rects)
    const hash = hashOfConstraints(
      args.rect,
      args.exclude_rects,
      args.limit,
      args.offset
    )
    const resultPath = getResultPath(file_path, page_name, artboard_name, hash)

    // 命中缓存直接返回
    if (
      (await fileExists(resultPath)) &&
      (await isFileNewerThan(resultPath, file_path))
    ) {
      if (persist) {
        return `artboard layer saved to ${resultPath}.`
      }
      return await readFile(resultPath, 'utf-8')
    }

    // 未命中：解析 → 过滤 → 生成预览 → persist
    const sketchHtmlData = await openSketchHtmlFile(file_path)
    const targetArtboard = filterArtboards(args, sketchHtmlData.data.artboards)
    const artboard = await assembleArtboard(
      targetArtboard,
      args,
      sketchHtmlData.images
    )

    await processPreview(
      artboard,
      file_path,
      rect,
      excludeRects,
      sketchHtmlData.images
    )

    // persist 存过滤+分页结果，命中时直接返回
    if (persist) {
      const result = {
        ...artboard,
        layers: filterCachedLayers(
          artboard.layers,
          rect,
          excludeRects,
          args.limit,
          args.offset
        )
      }
      await writeJsonFile(resultPath, result)
      return `artboard layer saved to ${resultPath}.`
    }

    // 非 persist：过滤 + limit/offset 直接返回
    return JSON.stringify({
      ...artboard,
      layers: filterCachedLayers(
        artboard.layers,
        rect,
        excludeRects,
        args.limit,
        args.offset
      )
    })
  } catch (error) {
    return `tool error: ${error instanceof Error ? error.message : 'unknown error'}`
  }
}
