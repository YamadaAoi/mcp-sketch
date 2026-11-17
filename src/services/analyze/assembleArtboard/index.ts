import path from 'path'
import fs from 'fs/promises'
import { createHash } from 'node:crypto'
import { pinyin } from 'pinyin-pro'
import {
  normalize,
  type HtmlArtboard,
  type HtmlLayer,
  type HtmlSketchArtboard,
  type HtmlSketchLayer,
  type SketchImage
} from '@/utils/zip'
import { fileExists, processImage } from '@/utils/saveFile'
import {
  getExistingAssetPath,
  registerAsset,
  registerAssetName,
  type AssetNameOrigin
} from '@/utils/assetIndex'
import { getEnv } from '@/utils/env'
import { getSharp } from '@/utils/imageProcessor'
import { isNumber, roundIfExceeds } from '@/utils/util'
import type { SketchAnalyzeInputSchema } from '..'

function toPinyin(str: string): string {
  const cleaned = str.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, ' ').trim()
  const result = cleaned.replace(
    /[\u4e00-\u9fa5]+/g,
    m => ` ${pinyin(m, { toneType: 'none' })} `
  )
  const normalized = result
    .replace(/ +/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  // 纯符号命名等场景下可能为空，回退为内容哈希，避免同名图层切图互相覆盖
  return (
    normalized ||
    `name-${createHash('md5').update(str).digest('hex').slice(0, 8)}`
  )
}

function filterSketchLayer(lyr: HtmlSketchLayer) {
  return (
    (lyr.type === 'slice' && !!lyr.assets?.length) ||
    lyr.type === 'text' ||
    (lyr.type === 'shape' &&
      lyr.css?.some(
        s =>
          s.includes('background') ||
          s.includes('border') ||
          s.includes('shadow')
      ))
  )
}

/**
 * 原始图层（HtmlLayer）是否有视觉输出价值，与 filterSketchLayer（assets 挂载后）的判定一致：
 * slice 图层在切图未挂载时用 exportable 预判，供 list 的 size 统计等场景在 assemble 前使用，
 * 保证与 analyze 实际返回的图层集合一致
 */
export function isVisualHtmlLayer(lyr: HtmlLayer) {
  return (
    (lyr.type === 'slice' && !!lyr.exportable?.length) ||
    lyr.type === 'text' ||
    (lyr.type === 'shape' &&
      lyr.css?.some(
        s =>
          s.includes('background') ||
          s.includes('border') ||
          s.includes('shadow')
      ))
  )
}

/**
 * 区域查询的边界容差：rect 查询时，完全落于 rect 外扩该容差内、又不完全落于 rect 内的
 * 压线图层单独收入 adjacent 字段返回（导出坐标抖动、元素溢出几像素的常见情形）
 */
const RECT_TOLERANCE = 10

/** 图层完全落于 rect 内（含边界重合）——区域查询主列表的判定 */
function isLayerFullyInside(
  lyr: HtmlSketchLayer,
  rect: [number, number, number, number]
) {
  const r = lyr.rect
  if (r?.length !== 4) return false
  const [x, y, w, h] = r.map(Number)
  return (
    x >= rect[0] &&
    x < rect[0] + rect[2] &&
    y >= rect[1] &&
    y < rect[1] + rect[3] &&
    x + w > rect[0] &&
    x + w <= rect[0] + rect[2] &&
    y + h > rect[1] &&
    y + h <= rect[1] + rect[3]
  )
}

function filterSketchLayerByRect(
  lyr: HtmlSketchLayer,
  rect?: [number, number, number, number],
  excludeRects?: [number, number, number, number][]
) {
  const r = lyr.rect
  if (r?.length !== 4) return false

  if (rect && !isLayerFullyInside(lyr, rect)) return false

  const [x, y, w, h] = r.map(Number)
  if (excludeRects?.length) {
    const rRight = x + w
    const rBottom = y + h
    for (const e of excludeRects) {
      const eRight = e[0] + e[2]
      const eBottom = e[1] + e[3]
      if (x >= e[0] && y >= e[1] && rRight <= eRight && rBottom <= eBottom) {
        return false
      }
    }
  }

  return filterSketchLayer(lyr)
}

function calculateLayoutScore(rect: {
  x?: number
  y?: number
  width?: number
  height?: number
}) {
  const width = rect.width ?? 0
  const height = rect.height ?? 0
  const area = width * height
  const longestSide = Math.max(width, height)
  const minSide = Math.min(width, height)
  const aspectRatio = minSide > 0 ? longestSide / minSide : 0

  let score = area
  if (aspectRatio >= 30) {
    score += longestSide * 14
  }
  return score
}

function rankLayers(layers: HtmlLayer[]) {
  return layers
    .map((layer, index) => ({ layer, index }))
    .sort(
      (a, b) =>
        calculateLayoutScore(b.layer.rect ?? {}) -
        calculateLayoutScore(a.layer.rect ?? {})
    )
}

export function hasValidRect(lyr: HtmlLayer): boolean {
  const { x, y, width, height } = lyr.rect ?? {}
  return isNumber(x) && isNumber(y) && isNumber(width) && isNumber(height)
}

/**
 * 无信息量的 CSS 默认值声明，返回时过滤以节省 token
 */
export function isCssNoise(decl: string) {
  const d = decl.trim().replace(/;$/, '').toLowerCase()
  return (
    d === 'letter-spacing: 0' ||
    d === 'font-weight: 400' ||
    d === 'line-height: normal' ||
    d === 'text-align: left'
  )
}

export function toSketchLayer(lyr: HtmlLayer, index?: number): HtmlSketchLayer {
  const layer: HtmlSketchLayer = {
    type: lyr.type,
    name: lyr.name,
    rect: [
      roundIfExceeds(lyr.rect?.x)!,
      roundIfExceeds(lyr.rect?.y)!,
      roundIfExceeds(lyr.rect?.width)!,
      roundIfExceeds(lyr.rect?.height)!
    ]
  }
  if (index !== undefined) {
    layer.index = index
  }
  if (lyr.styleName) {
    layer.styleName = lyr.styleName
  }
  if (lyr.type === 'text' && lyr.content) {
    layer.content = lyr.content
  }
  if (typeof lyr.opacity === 'number' && lyr.opacity !== 1) {
    layer.opacity = lyr.opacity
  }
  if (typeof lyr.rotation === 'number' && lyr.rotation !== 0) {
    layer.rotation = lyr.rotation
  }
  const css = lyr.css?.filter(c => !isCssNoise(c))
  if (css?.length) {
    layer.css = css
  }
  return layer
}

/**
 * 克隆折叠的最小组成员数：不足该值的重复组不折叠（简单页保持原有输出形态）
 */
export const DEDUP_MIN_GROUP = 3

/** 克隆元组：[index, x, y]，文案非空时再附加 content */
export type CloneTuple = (string | number)[]

/** 重复图层折叠开关：.env.sketch 配 LAYER_DEDUP=off|0|false 关闭，缺省开启 */
export function isLayerDedupEnabled() {
  const v = String(getEnv('LAYER_DEDUP') ?? '')
    .trim()
    .toLowerCase()
  return !(v === 'off' || v === '0' || v === 'false')
}

/**
 * 重复图层折叠（无损压缩）：type/尺寸/样式/切图完全相同、仅位置与文案不同的图层成组，
 * 成员数 ≥ DEDUP_MIN_GROUP 的组保留首个（权重最高）成员为宿主行，其余折叠进 clones
 * 坐标表（按宿主行 index 索引，与 extras 同款稀疏表）。大面积重复（表格单元格、
 * 列表项等）场景输出可省约一半；达到阈值的组以成员分之和整体参与排序——重复整体
 * 作为一块大内容提权，骨架读取（-l）时表格类结构不会沉底；未达阈值的组不折叠也
 * 不提权，成员按各自原位保留（无折叠触发时输出次序与折叠前完全一致）
 * @param layers 已按权重降序排列、index 已赋值（z 序）的图层
 */
export function collapseDuplicateLayers(layers: HtmlSketchLayer[]): {
  layers: HtmlSketchLayer[]
  clones: Record<string, CloneTuple[]>
} {
  const clones: Record<string, CloneTuple[]> = {}
  if (!isLayerDedupEnabled()) return { layers, clones }

  const score = (l: HtmlSketchLayer) =>
    calculateLayoutScore({
      width: Number(l.rect?.[2]),
      height: Number(l.rect?.[3])
    })

  const entries: { members: HtmlSketchLayer[]; score: number }[] = []
  const byKey = new Map<string, (typeof entries)[number]>()
  for (const l of layers) {
    // 分组签名不含名称与文案：同款异位/异文正是克隆语义；index/x/y 天然除外；
    // opacity/rotation 参与签名——视觉表现必须完全一致才可折叠（否则克隆会丢样式差异）
    const key =
      l.rect?.length === 4
        ? JSON.stringify([
            l.type,
            l.rect[2],
            l.rect[3],
            l.css ?? [],
            l.assets?.map(a => a.path) ?? [],
            l.opacity ?? 1,
            l.rotation ?? 0
          ])
        : undefined
    const hit = key ? byKey.get(key) : undefined
    if (hit) {
      hit.members.push(l)
      hit.score += score(l)
      continue
    }
    const entry = { members: [l], score: score(l) }
    entries.push(entry)
    if (key) byKey.set(key, entry)
  }

  // 排序单元：达到阈值的组以成员分之和作为一个单元（大内容提权）；
  // 未达阈值的组逐成员各成一个单元（分值不变 → 稳定排序下保持原位次序）
  const units: {
    host: HtmlSketchLayer
    members?: HtmlSketchLayer[]
    score: number
  }[] = []
  for (const e of entries) {
    if (e.members.length >= DEDUP_MIN_GROUP) {
      units.push({ host: e.members[0], members: e.members, score: e.score })
    } else {
      for (const m of e.members) units.push({ host: m, score: score(m) })
    }
  }

  // 单元分降序；并列保持原次序（稳定排序）
  const ordered = units
    .map((u, i) => ({ u, i }))
    .sort((a, b) => b.u.score - a.u.score || a.i - b.i)
    .map(({ u }) => u)

  const out: HtmlSketchLayer[] = []
  for (const u of ordered) {
    out.push(u.host)
    if (!u.members) continue
    // 宿主 index 缺失时退化为行位置，与 toPositionalLayers 的 index 回退口径一致
    clones[String(u.host.index ?? out.length - 1)] = u.members
      .slice(1)
      .map(m => {
        const [x = 0, y = 0] = m.rect ?? []
        return m.content
          ? [m.index ?? 0, x, y, m.content]
          : [m.index ?? 0, x, y]
      })
  }
  return { layers: out, clones }
}

export interface FilterOptions {
  rect?: [number, number, number, number]
  excludeRects?: [number, number, number, number][]
  name?: string
  type?: 'text' | 'shape' | 'slice'
  limit?: number
  offset?: number
}

/**
 * 对已解析的图层（HtmlSketchLayer）做类型过滤 + 区域过滤 + 名称过滤 + 重复折叠 + 分页。
 * 重复折叠先于分页：limit/offset 作用于折叠后的宿主行
 * @returns layers 分页结果（宿主行），total 折叠后（分页前）的行数，
 * clones 重复折叠表（按宿主行 index 索引；未触发折叠时为空对象），
 * adjacent 区域查询时完全落于 rect 外扩 RECT_TOLERANCE 内、又不完全落于 rect 内的压线图层（未分页、未折叠）
 */
export function filterLayers(
  layers: HtmlSketchLayer[],
  opts: FilterOptions = {}
): {
  layers: HtmlSketchLayer[]
  total: number
  adjacent: HtmlSketchLayer[]
  clones: Record<string, CloneTuple[]>
} {
  const { rect, excludeRects, name, type, limit, offset } = opts

  let filtered = layers.filter(l =>
    filterSketchLayerByRect(l, rect, excludeRects)
  )

  if (type) {
    filtered = filtered.filter(l => l.type === type)
  }

  if (name) {
    const keyword = name.toLowerCase()
    filtered = filtered.filter(l => l.name.toLowerCase().includes(keyword))
  }

  // 压线图层：完全落于 rect 外扩容差内、又不完全落于 rect 内的图层，
  // 单独成列表供调用方判断归属；exclude/type/name 与主列表同口径
  let adjacent: HtmlSketchLayer[] = []
  if (rect) {
    const inflated: [number, number, number, number] = [
      rect[0] - RECT_TOLERANCE,
      rect[1] - RECT_TOLERANCE,
      rect[2] + RECT_TOLERANCE * 2,
      rect[3] + RECT_TOLERANCE * 2
    ]
    adjacent = layers.filter(
      l => isLayerFullyInside(l, inflated) && !isLayerFullyInside(l, rect)
    )
    adjacent = adjacent.filter(l =>
      filterSketchLayerByRect(l, undefined, excludeRects)
    )
    if (type) {
      adjacent = adjacent.filter(l => l.type === type)
    }
    if (name) {
      const keyword = name.toLowerCase()
      adjacent = adjacent.filter(l => l.name.toLowerCase().includes(keyword))
    }
  }

  const collapsed = collapseDuplicateLayers(filtered)
  const total = collapsed.layers.length

  // offset 单独使用时从第 offset 层返回到末尾；limit 截取前 limit 层
  let paged = collapsed.layers
  if (limit !== undefined || offset !== undefined) {
    const start = offset ?? 0
    paged =
      limit !== undefined
        ? collapsed.layers.slice(start, start + limit)
        : collapsed.layers.slice(start)
  }

  return { layers: paged, total, adjacent, clones: collapsed.clones }
}

/**
 * 定位数组格式的列声明，行内值严格按此顺序排列
 * 行内槽位固定：空值按列类型取（content 为 ""，css/assets 为 []）
 */
export const LAYER_COLUMNS = [
  'index',
  'name',
  'type',
  'x',
  'y',
  'w',
  'h',
  'content',
  'css',
  'assets'
] as const

/**
 * 图层数据转定位数组：列名声明一次，行内按序取值，省去逐层重复的 key
 * 低频可选字段（opacity/rotation）不占列，收入按 index 索引的 extras，避免行宽膨胀；
 * styleName 不输出（css 已承载样式值，设计系统级样式名聚合见 list 的 tokens.styleNames）
 * assets 只保留切图文件路径（name 与图层名重复，format 是导出时的原始格式而非转码后的 webp，均无价值）
 * 行宽固定为 LAYER_COLUMNS.length；list 服务也用此函数计算 size，保证数据量口径与 analyze 输出一致
 */
export function toPositionalLayers(layers: HtmlSketchLayer[]) {
  const extras: Record<string, Record<string, number>> = {}
  const rows = layers.map((l, i) => {
    const [x = '', y = '', w = '', h = ''] = l.rect ?? []
    const extra: Record<string, number> = {}
    if (l.opacity !== undefined) extra.opacity = l.opacity
    if (l.rotation !== undefined) extra.rotation = l.rotation
    const index = l.index ?? i
    if (Object.keys(extra).length) extras[index] = extra
    return [
      index,
      l.name,
      l.type,
      x,
      y,
      w,
      h,
      l.content ?? '',
      l.css ?? [],
      l.assets?.map(a => a.path) ?? []
    ]
  })
  return { rows, extras }
}

function toRelPath(p: string) {
  return path.relative(
    getEnv('CWD'),
    path.isAbsolute(p) ? p : path.resolve(getEnv('CWD'), p)
  )
}

/**
 * 切图编码：sharp 可用时压缩为 webp，否则保留原始格式
 * 编码到内存而非直接落盘，以便索引丢失时与已存在的同名文件做内容比对
 */
async function encodeAsset(buffer: Buffer, ext: string) {
  const sharp = await getSharp()
  if (sharp) {
    return {
      buffer: await sharp(buffer).webp({ quality: 90, effort: 4 }).toBuffer(),
      ext: '.webp'
    }
  }
  return { buffer, ext }
}

async function writeAsset(buffer: Buffer, target: string) {
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, buffer)
  const resolved = path.isAbsolute(target)
    ? target
    : path.resolve(getEnv('CWD'), target)
  return path.relative(getEnv('CWD'), resolved)
}

async function compressAssets(
  layers: HtmlLayer[],
  sketchLayers: HtmlSketchLayer[],
  dest: string,
  images?: SketchImage[],
  pageName?: string,
  artboardName?: string
) {
  const pageDir = pageName ? toPinyin(pageName) : ''
  const artboardDir = artboardName ? toPinyin(artboardName) : ''

  for (let i = 0; i < layers.length; i++) {
    const l = layers[i]
    if (!l.exportable?.length) continue
    sketchLayers[i].assets = await Promise.all(
      l.exportable.map(async e => {
        const normalizedPath = normalize(e.path)
        const parsed = path.parse(normalizedPath)
        const imageData = images?.find(item =>
          item.path.endsWith(normalizedPath)
        )
        let imagePath = ''
        if (imageData) {
          // 拼音文件名的溯源（同内容去重后一个文件可对应多个图层）
          const origin: AssetNameOrigin = {
            name: parsed.base,
            page: pageName ?? '',
            artboard: artboardName ?? '',
            layer: l.name
          }
          const sourceBuffer = await imageData.getData()
          const hash = createHash('sha1')
            .update(sourceBuffer)
            .digest('hex')
            .slice(0, 12)

          // 全局去重：同内容切图（跨画板共享的图标等）复用已写入的文件
          const existing = await getExistingAssetPath(hash, dest)
          if (existing) {
            imagePath = existing
            await registerAssetName(imagePath, origin)
          } else {
            const pinyinName = toPinyin(parsed.name)
            const encoded = await encodeAsset(sourceBuffer, parsed.ext)
            const outHash = createHash('sha1')
              .update(encoded.buffer)
              .digest('hex')
              .slice(0, 12)
            const target = path.join(
              dest,
              pageDir,
              artboardDir,
              `${pinyinName}${encoded.ext}`
            )
            if (await fileExists(target)) {
              const targetHash = createHash('sha1')
                .update(await fs.readFile(target))
                .digest('hex')
                .slice(0, 12)
              if (targetHash === outHash) {
                // 索引丢失自愈：同名文件内容一致，直接复用
                imagePath = toRelPath(target)
              } else {
                // 同名不同内容：追加哈希后缀，避免覆盖成错误的图
                imagePath = await writeAsset(
                  encoded.buffer,
                  path.join(
                    dest,
                    pageDir,
                    artboardDir,
                    `${pinyinName}-${hash}${encoded.ext}`
                  )
                )
              }
            } else {
              imagePath = await writeAsset(encoded.buffer, target)
            }
            await registerAsset(hash, dest, imagePath, origin)
          }
        }
        return {
          ...e,
          path: imagePath
        }
      })
    )
  }
}

export async function processPreview(
  artboardInfo: {
    pageName: string
    name: string
    width: number
    previewPath?: string
  },
  filePath: string,
  rect?: [number, number, number, number],
  excludeRects?: [number, number, number, number][],
  images?: SketchImage[]
) {
  if (!artboardInfo.previewPath) return

  const image = images?.find(item =>
    item.path.endsWith(artboardInfo.previewPath!)
  )
  const sourceBuffer = image ? await image.getData() : undefined
  if (!sourceBuffer) return

  const extname = path.extname(artboardInfo.previewPath)
  const fileName = path.basename(artboardInfo.previewPath, extname)
  const cwd = getEnv('CWD')
  const designFileName = path.basename(filePath, '.zip')
  const dest = path.resolve(
    cwd,
    `.sketch-cache/${designFileName}/${artboardInfo.pageName}/${artboardInfo.name}`,
    `${fileName}${rect ? `_${rect.join('_')}` : ''}${excludeRects?.length ? `_exclude_${createHash('md5').update(JSON.stringify(excludeRects)).digest('hex').slice(0, 8)}` : ''}${extname}`
  )
  const previewPath = await processImage(
    sourceBuffer,
    dest,
    artboardInfo.width,
    rect
  )

  return path.relative(getEnv('CWD'), previewPath)
}

export async function assembleArtboard(
  artboard: HtmlArtboard,
  args: SketchAnalyzeInputSchema,
  images?: SketchImage[]
) {
  const dest = args.assets_path ?? getEnv('ASSETS_PATH')

  const ranked = rankLayers(artboard.layers.filter(hasValidRect))

  const newArtboard: HtmlSketchArtboard = {
    previewPath: artboard.imagePath ? normalize(artboard.imagePath) : undefined,
    pageName: artboard.pageName,
    pageObjectID: artboard.pageObjectID,
    name: artboard.name,
    objectID: artboard.objectID,
    width: artboard.width,
    height: artboard.height,
    layers: ranked.map(e => toSketchLayer(e.layer, e.index))
  }

  await compressAssets(
    ranked.map(e => e.layer),
    newArtboard.layers,
    dest,
    images,
    artboard.pageName,
    artboard.name
  )

  return newArtboard
}
