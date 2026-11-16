import { mkdir, readFile } from 'fs/promises'
import path from 'path'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { getEnv } from '@/utils/env'
import { getSharp } from '@/utils/imageProcessor'
import { fileExists } from '@/utils/saveFile'

export const sketchCompareInputSchema = z.object({
  base_image: z
    .string()
    .describe(
      'base image path (required): the design-side reference — the artboard previewPath from `list` for a whole-page compare, or the region previewPath from `analyze -r` for a component'
    ),
  screenshot_path: z
    .string()
    .describe(
      'implementation screenshot path (required): a full-page screenshot for a whole-page compare, or an element screenshot for a component'
    )
})

export type SketchCompareInputSchema = SchemaOutput<
  typeof sketchCompareInputSchema
>

/**
 * 纯两图差异器：基准图（设计侧）与实现截图（页面侧）逐像素比对
 * 截图先按宽度对齐到基准图，取共同高度区域计算差异
 * 两侧的区域定位都在上游完成——基准图用 analyze -r 返回的区域预览（已按 rect 裁剪），
 * 截图用 Playwright 元素截图（已按 DOM 定位），compare 不携带设计栈知识
 * @param args 输入参数
 * @returns 相似度分数与差异图路径
 */
export async function sketchCompare(args: SketchCompareInputSchema) {
  const sharp = await getSharp()
  if (!sharp) {
    throw new Error('sharp is required for compare, please install sharp first')
  }

  const resolveCwd = (p: string) =>
    path.isAbsolute(p) ? p : path.resolve(getEnv('CWD'), p)

  const readImage = async (p: string, label: string) => {
    try {
      return await readFile(resolveCwd(p))
    } catch (e) {
      const code = (e as NodeJS.ErrnoException)?.code
      if (code === 'ENOENT') throw new Error(`${label} not found: ${p}`)
      throw new Error(
        `${label} not readable: ${p} (${code ?? 'unknown error'})`
      )
    }
  }
  const metaOf = async (buf: Buffer, label: string, p: string) => {
    try {
      const meta = await sharp(buf).metadata()
      if (meta.width && meta.height) return meta
    } catch {
      // 落到下方的统一报错
    }
    throw new Error(`invalid ${label}: ${p}`)
  }

  const baseAbs = resolveCwd(args.base_image)
  const baseBuf = await readImage(args.base_image, 'base image')
  const shotBuf = await readImage(args.screenshot_path, 'screenshot image')

  const bMeta = await metaOf(baseBuf, 'base image', args.base_image)
  const sMeta = await metaOf(shotBuf, 'screenshot image', args.screenshot_path)

  // 截图缩放到基准图宽度后的高度（等比）——实现图向基准图靠拢
  const width = bMeta.width
  const sResizedHeight = Math.round(sMeta.height * (width / sMeta.width))

  // 取两边共同高度区域
  const height = Math.min(bMeta.height, sResizedHeight)
  if (height <= 0) {
    throw new Error(`invalid screenshot image: ${args.screenshot_path}`)
  }
  const baseCropped = await sharp(baseBuf)
    .extract({ left: 0, top: 0, width, height })
    .png()
    .toBuffer()
  const shotCropped = await sharp(shotBuf)
    .resize({ width })
    .extract({ left: 0, top: 0, width, height })
    .png()
    .toBuffer()
  const compared = { width, height }

  const diffBuf = await sharp(baseCropped)
    .composite([{ input: shotCropped, blend: 'difference' }])
    .png()
    .toBuffer()

  const stat = await sharp(diffBuf).stats()
  const rgbMeans = stat.channels.slice(0, 3).map(c => c.mean)
  const avgDiff = rgbMeans.reduce((a, b) => a + b, 0) / rgbMeans.length
  const score = 1 - avgDiff / 255

  // 差异图归档到基准图所在目录的 compare/ 子目录（与截图的 screenshot/ 约定对齐），文件名为时间戳；
  // 同名文件已存在时顺延时间戳，避免同毫秒多次比对互相覆盖
  let stamp = Date.now()
  let diffDest = path.join(path.dirname(baseAbs), 'compare', `${stamp}.webp`)
  while (await fileExists(diffDest)) {
    diffDest = path.join(path.dirname(baseAbs), 'compare', `${++stamp}.webp`)
  }
  await mkdir(path.dirname(diffDest), { recursive: true })
  await sharp(diffBuf).linear(20, 0).webp({ quality: 90 }).toFile(diffDest)
  const cwd = getEnv('CWD')
  // 跨盘符（Windows 下基准图与 cwd 不同盘）时相对路径不存在，path.relative 会返回绝对路径——原样输出，字段仍可直接定位文件
  const diffPath = path.relative(cwd, diffDest)

  return JSON.stringify({
    score: Number(score.toFixed(4)),
    similarity: `${(score * 100).toFixed(2)}%`,
    base: path.relative(cwd, baseAbs),
    baseSize: { width: bMeta.width, height: bMeta.height },
    screenshot: { width: sMeta.width, height: sMeta.height },
    comparedRegion: compared,
    diffPath
  })
}
