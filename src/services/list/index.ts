import { readFile, stat } from 'fs/promises'
import { basename, resolve } from 'path'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import {
  getDesignStamp,
  openSketchHtmlFile,
  normalize,
  type HtmlArtboard,
  type HtmlLayer,
  type SketchHtmlFile,
  type SketchImage
} from '@/utils/zip'
import { writeJsonFile } from '@/utils/saveFile'
import { getEnv } from '@/utils/env'
import {
  filterLayers,
  hasValidRect,
  processPreview,
  toSketchLayer
} from '../analyze/assembleArtboard'

export const sketchListInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)')
})

export type SketchListInputSchema = SchemaOutput<typeof sketchListInputSchema>

interface ListItem {
  pageName: string
  artboardName: string
  size: number
  previewPath?: string
}

interface TokensSummary {
  colors: Record<string, number>
  fontSizes: Record<string, number>
  fontFamilies: Record<string, number>
  radii: Record<string, number>
  shadows: Record<string, number>
  styleNames: Record<string, { count: number; css: string[] }>
}

interface ListFile {
  artboards: ListItem[]
  tokens: TokensSummary
}

function getListPath(filePath: string) {
  const designFileName = basename(filePath, '.zip')
  return resolve(getEnv('CWD'), `.sketch-cache/${designFileName}/list.json`)
}

async function getListInfo(
  file_path: string,
  artboard: HtmlArtboard,
  images?: SketchImage[]
) {
  const { layers } = filterLayers(
    (artboard?.layers ?? []).filter(hasValidRect).map(toSketchLayer)
  )
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

function isVisualLayer(lyr: HtmlLayer) {
  return (
    (lyr.type === 'slice' && !!lyr.exportable?.length) ||
    lyr.type === 'text' ||
    (lyr.type === 'shape' && !!lyr.css?.length)
  )
}

const COLOR_RE =
  /(?:^|;)\s*(?:color|background|background-color|border(?:-top|-right|-bottom|-left)?(?:-color)?)\s*:\s*([^;]+)/i
const FONT_SIZE_RE = /(?:^|;)\s*font-size\s*:\s*([^;]+)/i
const FONT_FAMILY_RE = /(?:^|;)\s*font-family\s*:\s*([^;]+)/i
const RADIUS_RE = /(?:^|;)\s*border-radius\s*:\s*([^;]+)/i
const SHADOW_RE = /(?:^|;)\s*box-shadow\s*:\s*([^;]+)/i

function extract(css: string[], re: RegExp): string[] {
  return css
    .map(decl => decl.match(re)?.[1]?.trim())
    .filter((v): v is string => !!v)
}

function toCountMap(values: string[]) {
  const map = new Map<string, number>()
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1)
  return Object.fromEntries([...map.entries()].sort((a, b) => b[1] - a[1]))
}

/**
 * 聚合设计稿内的设计 token：颜色、字号、字体、圆角、阴影、样式名分组
 * 结果随 list.json 持久化，用于快速理解设计系统、建立项目主题变量
 * @param sketch - 已解析的设计稿数据
 * @returns token 聚合结果（styleNames 只保留前 20 组，控制体积）
 */
function aggregateTokens(sketch: SketchHtmlFile): TokensSummary {
  const colors: string[] = []
  const fontSizes: string[] = []
  const fontFamilies: string[] = []
  const radii: string[] = []
  const shadows: string[] = []
  const styleNames = new Map<string, { count: number; css: string[] }>()

  for (const artboard of sketch.data.artboards ?? []) {
    for (const lyr of artboard.layers ?? []) {
      if (!isVisualLayer(lyr) || !lyr.css?.length) continue

      colors.push(...extract(lyr.css, COLOR_RE))
      fontSizes.push(...extract(lyr.css, FONT_SIZE_RE))
      fontFamilies.push(...extract(lyr.css, FONT_FAMILY_RE))
      radii.push(...extract(lyr.css, RADIUS_RE))
      shadows.push(...extract(lyr.css, SHADOW_RE))

      if (lyr.styleName) {
        const cur = styleNames.get(lyr.styleName) ?? { count: 0, css: [] }
        cur.count++
        if (!cur.css.length) cur.css = lyr.css
        styleNames.set(lyr.styleName, cur)
      }
    }
  }

  return {
    colors: toCountMap(colors),
    fontSizes: toCountMap(fontSizes),
    fontFamilies: toCountMap(fontFamilies),
    radii: toCountMap(radii),
    shadows: toCountMap(shadows),
    styleNames: Object.fromEntries(
      [...styleNames.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20)
    )
  }
}

/**
 * 获取sketch html文件中的所有artboard列表与设计token聚合
 * 结果写入 .sketch-cache/{design}/list.json（{ artboards, tokens }）并返回JSON
 * 设计稿比 list.json 新时（zip 按文件 mtime，目录按内部文件最新 mtime）重新生成，不返回过期缓存
 * @param args 输入参数
 * @param args.file_path sketch html文件路径
 * @returns 画板列表与token聚合JSON，末尾附 list.json 落盘路径
 */
export async function sketchList(args: SketchListInputSchema) {
  const listPath = getListPath(args.file_path)
  const stamp = await getDesignStamp(args.file_path)
  const listStat = await stat(listPath).catch(() => undefined)
  const stampValid =
    stamp !== undefined && !!listStat && listStat.mtimeMs >= stamp

  let data: ListFile | undefined

  if (stampValid) {
    try {
      const parsed = JSON.parse(await readFile(listPath, 'utf8')) as ListFile
      if (Array.isArray(parsed?.artboards) && parsed.tokens) {
        data = parsed
      }
    } catch {
      // 缓存文件损坏，重新生成
    }
  }

  if (!data) {
    const sketchData = await openSketchHtmlFile(args.file_path)
    const promises = (sketchData?.data?.artboards ?? []).map(a =>
      getListInfo(args.file_path, a, sketchData.images)
    )
    const artboards = await Promise.all(promises)
    data = { artboards, tokens: aggregateTokens(sketchData) }
    await writeJsonFile(listPath, data)
  }

  return `${JSON.stringify(data)}\n\nsaved to ${listPath}`
}
