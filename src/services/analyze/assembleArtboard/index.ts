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
import { getExistingAssetPath, registerAsset } from '@/utils/assetIndex'
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

function filterSketchLayerByRect(
  lyr: HtmlSketchLayer,
  rect?: [number, number, number, number],
  excludeRects?: [number, number, number, number][]
) {
  const r = lyr.rect
  if (r?.length !== 4) return false
  const [x, y, w, h] = r.map(Number)

  if (rect) {
    const isInRect =
      x >= rect[0] &&
      x < rect[0] + rect[2] &&
      y >= rect[1] &&
      y < rect[1] + rect[3] &&
      x + w > rect[0] &&
      x + w <= rect[0] + rect[2] &&
      y + h > rect[1] &&
      y + h <= rect[1] + rect[3]
    if (!isInRect) return false
  }

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
function isCssNoise(decl: string) {
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

export interface FilterOptions {
  rect?: [number, number, number, number]
  excludeRects?: [number, number, number, number][]
  name?: string
  type?: 'text' | 'shape' | 'slice'
  limit?: number
  offset?: number
}

/**
 * 对已解析的图层（HtmlSketchLayer）做类型过滤 + 区域过滤 + 名称过滤 + 分页。
 * @returns layers 分页结果，total 过滤后（分页前）的总数
 */
export function filterLayers(
  layers: HtmlSketchLayer[],
  opts: FilterOptions = {}
): { layers: HtmlSketchLayer[]; total: number } {
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

  const total = filtered.length

  if (limit !== undefined) {
    const start = offset ?? 0
    filtered = filtered.slice(start, start + limit)
  }

  return { layers: filtered, total }
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
        const imageData = images?.find(item =>
          item.path.endsWith(normalizedPath)
        )
        let imagePath = ''
        if (imageData) {
          const sourceBuffer = await imageData.getData()
          const hash = createHash('sha1')
            .update(sourceBuffer)
            .digest('hex')
            .slice(0, 12)

          // 全局去重：同内容切图（跨画板共享的图标等）复用已写入的文件
          const existing = await getExistingAssetPath(hash, dest)
          if (existing) {
            imagePath = existing
          } else {
            const parsed = path.parse(normalizedPath)
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
            await registerAsset(hash, dest, imagePath)
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
