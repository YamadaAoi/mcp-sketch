import { readFile, stat } from 'fs/promises'
import { basename, resolve } from 'path'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import {
  getDesignStamp,
  openSketchHtmlFile,
  normalize,
  type HtmlArtboard,
  type SketchHtmlFile,
  type SketchImage
} from '@/utils/zip'
import { writeJsonFile } from '@/utils/saveFile'
import { getEnv } from '@/utils/env'
import {
  collapseDuplicateLayers,
  hasValidRect,
  isCssNoise,
  isVisualHtmlLayer,
  processPreview,
  toPositionalLayers,
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
  /** 疑似切图画板（切图占比在全部画板中断档领先：≥ max(10%, 中位数×3)）：设计师集中放置切图的收集板，非待还原页面；启发式标记，结合预览图确认 */
  sliceBoard?: true
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
  /** 缓存结构版本：工具的输出逻辑升级（如 tokens 摘选规则变化、sliceBoard 判定换算法）时递增，旧缓存自动失效重建 */
  v: number
  artboards: ListItem[]
  tokens: TokensSummary
}

const LIST_VERSION = 3

/** 断档线下限：占比低于此值连疑似都不算（防"全员趋零"的设计里，小差距虽达 3×中位数但不构成切图板信号） */
const SLICE_SHARE_FLOOR = 0.1
/** 断档倍率：占比达到全部画板中位数的该倍数才算断档领先 */
const SLICE_SHARE_K = 3

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * 疑似切图画板断档判定（纯函数，供 10-slice-flag 单测直调）：
 * 占比 ≥ max(SLICE_SHARE_FLOOR, 全部画板占比中位数 × SLICE_SHARE_K) 判疑似
 * - 相对中位数自适应各设计自身分布：断档领先才标，多块切图画板可同时标中
 * - 无切图板 / 全是切图板 / 单画板 / 两画板等无对照的场景自动一个不标
 * - 固定常数不可用：切图板常带大量文字标注图层（如 142 层中仅 32 层切图，占比 0.22），任何绝对阈值都会被真实设计击穿
 */
export function flagSliceOutliers(shares: number[]): boolean[] {
  const threshold = Math.max(SLICE_SHARE_FLOOR, SLICE_SHARE_K * median(shares))
  return shares.map(s => s >= threshold)
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
  // 与 analyze 输出同集合同口径：slice 图层按 exportable 预判（assets 未挂载），index 取 z-order
  const valid = (artboard?.layers ?? []).filter(hasValidRect)
  const layers = valid.flatMap((l, i) => {
    if (!isVisualHtmlLayer(l)) return []
    const s = toSketchLayer(l, i)
    // 挂原始 exportable 引用参与折叠签名与字节估算（不导出、不落盘）：
    // 区分同尺寸异内容的切图，避免过度折叠；字节量与 analyze 的真实切图路径同量级
    if (l.exportable?.length) s.assets = l.exportable
    return [s]
  })
  // size 口径与 analyze 输出一致：重复折叠后的宿主行 + extras + clones（供模型估算单次 analyze 返回的数据量）
  const collapsed = collapseDuplicateLayers(layers)
  const { rows, extras } = toPositionalLayers(collapsed.layers)
  const size =
    Buffer.byteLength(JSON.stringify(rows)) +
    (Object.keys(extras).length
      ? Buffer.byteLength(JSON.stringify(extras))
      : 0) +
    (Object.keys(collapsed.clones).length
      ? Buffer.byteLength(JSON.stringify(collapsed.clones))
      : 0)
  // 切图占比基于视觉图层集合（与 analyze 返回同集合），折叠前统计；
  // 疑似标记由全部画板占比的断档判定统一给出（见 sketchList 内）
  const sliceCount = layers.filter(l => l.type === 'slice').length
  const sliceShare = layers.length > 0 ? sliceCount / layers.length : 0
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
  const item: ListItem = {
    pageName: artboard.pageName,
    artboardName: artboard.name,
    size
  }
  if (previewPath) item.previewPath = previewPath
  return { item, sliceShare }
}

const COLOR_DECL_RE =
  /(?:^|;)\s*(color|background|background-color|border(?:-top|-right|-bottom|-left)?(?:-color)?)\s*:\s*([^;]+)/i
/** 颜色原子：hex / rgb / rgba / hsl / hsla */
const COLOR_VALUE_RE = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))/
const COLOR_VALUE_ALL_RE = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))/g
const FONT_SIZE_RE = /(?:^|;)\s*font-size\s*:\s*([^;]+)/i
const FONT_FAMILY_RE = /(?:^|;)\s*font-family\s*:\s*([^;]+)/i
const RADIUS_RE = /(?:^|;)\s*border-radius\s*:\s*([^;]+)/i
const SHADOW_RE = /(?:^|;)\s*box-shadow\s*:\s*([^;]+)/i

function extract(css: string[], re: RegExp): string[] {
  return css
    .map(decl => decl.match(re)?.[1]?.trim())
    .filter((v): v is string => !!v)
}

/**
 * 提取颜色 token：
 * - color/background 值本身即颜色时保持原样；渐变等复合值取其中的全部颜色原子；命名色等无原子的值保留原文
 * - border 简写携带宽度/线型（如 `1px solid #C8CBCD`），只取其中的颜色原子，避免非颜色串混入色板
 */
function extractColors(css: string[]): string[] {
  const out: string[] = []
  for (const decl of css) {
    const m = decl.match(COLOR_DECL_RE)
    if (!m) continue
    const value = m[2].trim()
    if (m[1].toLowerCase().startsWith('border')) {
      const atom = value.match(COLOR_VALUE_RE)?.[1]
      if (atom) out.push(atom)
    } else {
      const atoms = [...value.matchAll(COLOR_VALUE_ALL_RE)].map(a => a[0])
      if (atoms.length) out.push(...atoms)
      else out.push(value)
    }
  }
  return out
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
      if (!isVisualHtmlLayer(lyr) || !lyr.css?.length) continue

      colors.push(...extractColors(lyr.css))
      fontSizes.push(...extract(lyr.css, FONT_SIZE_RE))
      fontFamilies.push(...extract(lyr.css, FONT_FAMILY_RE))
      radii.push(...extract(lyr.css, RADIUS_RE))
      shadows.push(...extract(lyr.css, SHADOW_RE))

      if (lyr.styleName) {
        const cur = styleNames.get(lyr.styleName) ?? { count: 0, css: [] }
        cur.count++
        // 代表性 css 与逐层输出同口径：过滤无信息量的默认值声明
        if (!cur.css.length) cur.css = lyr.css.filter(c => !isCssNoise(c))
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
 * 结果写入 .sketch-cache/{design}/list.json（{ v, artboards, tokens }）并返回JSON
 * 设计稿比 list.json 新时（zip 按文件 mtime，目录按内部文件最新 mtime）或缓存结构版本不匹配（输出逻辑升级）时重新生成，不返回过期缓存
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
      // v 缺失（旧版工具产出）或不匹配时视为过期：输出逻辑升级不能沿用旧缓存（如 tokens 摘选规则、sliceBoard 判定算法变化）
      if (
        parsed?.v === LIST_VERSION &&
        Array.isArray(parsed?.artboards) &&
        parsed.tokens
      ) {
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
    const infos = await Promise.all(promises)
    // 断档判定需要全部画板的占比：统一按中位数断档线标记
    const flags = flagSliceOutliers(infos.map(i => i.sliceShare))
    const artboards = infos.map(({ item }, i) => {
      if (flags[i]) item.sliceBoard = true
      return item
    })
    data = {
      v: LIST_VERSION,
      artboards,
      tokens: aggregateTokens(sketchData)
    }
    await writeJsonFile(listPath, data)
  }

  return `${JSON.stringify(data)}\n\nsaved to ${listPath}`
}
