import { readFile } from 'fs/promises'
import path from 'path'
import type { SchemaOutput } from '@modelcontextprotocol/sdk/server/zod-compat.js'
import { z } from 'zod/v4'
import { openSketchHtmlFile, normalize } from '@/utils/zip'
import { getEnv } from '@/utils/env'
import { getSharp } from '@/utils/imageProcessor'
import { processPreview } from '../analyze/assembleArtboard'

export const sketchCompareInputSchema = z.object({
  file_path: z
    .string()
    .describe('sketch html export path (zip or folder, required)'),
  page_name: z.string().describe('page name (required)'),
  artboard_name: z.string().describe('artboard name (required)'),
  screenshot_path: z
    .string()
    .describe(
      'browser screenshot file path to compare with the artboard preview (required)'
    )
})

export type SketchCompareInputSchema = SchemaOutput<
  typeof sketchCompareInputSchema
>

function findArtboard(
  args: SketchCompareInputSchema,
  artboards: Awaited<ReturnType<typeof openSketchHtmlFile>>['data']['artboards']
) {
  const matched = (artboards ?? []).filter(
    a => a.pageName === args.page_name && a.name === args.artboard_name
  )
  if (!matched.length) {
    throw new Error(
      `Page: ${args.page_name} & Artboard: ${args.artboard_name} not found! Tip: Run 'npx -y mcp-sketch list -f "${args.file_path}"' to check available page and artboard names.`
    )
  }
  return matched[0]
}

/**
 * 对比浏览器截图与画板预览图
 * 截图会先按宽度对齐到预览图，取共同高度区域做逐像素差异
 * @param args 输入参数
 * @returns 相似度分数与差异图路径
 */
export async function sketchCompare(args: SketchCompareInputSchema) {
  const sharp = await getSharp()
  if (!sharp) {
    throw new Error('sharp is required for compare, please install sharp first')
  }

  const sketch = await openSketchHtmlFile(args.file_path)
  const artboard = findArtboard(args, sketch.data.artboards)

  const previewPath = await processPreview(
    {
      pageName: artboard.pageName,
      name: artboard.name,
      width: artboard.width,
      previewPath: artboard.imagePath
        ? normalize(artboard.imagePath)
        : undefined
    },
    args.file_path,
    undefined,
    undefined,
    sketch.images
  )
  if (!previewPath) {
    throw new Error(`preview image not found for artboard ${artboard.name}`)
  }

  const resolveCwd = (p: string) =>
    path.isAbsolute(p) ? p : path.resolve(getEnv('CWD'), p)

  const previewBuf = await readFile(resolveCwd(previewPath))
  const shotBuf = await readFile(resolveCwd(args.screenshot_path))

  const pMeta = await sharp(previewBuf).metadata()
  const width = pMeta.width
  if (!width || !pMeta.height) {
    throw new Error(`invalid preview image: ${previewPath}`)
  }
  const sMeta = await sharp(shotBuf).metadata()
  const sResizedMeta = await sharp(shotBuf).resize({ width }).metadata()
  const height = Math.min(pMeta.height, sResizedMeta.height ?? 0)
  if (height <= 0) {
    throw new Error(`invalid screenshot image: ${args.screenshot_path}`)
  }

  const previewCropped = await sharp(previewBuf)
    .extract({ left: 0, top: 0, width, height })
    .png()
    .toBuffer()
  const shotCropped = await sharp(shotBuf)
    .resize({ width })
    .extract({ left: 0, top: 0, width, height })
    .png()
    .toBuffer()

  const diffBuf = await sharp(previewCropped)
    .composite([{ input: shotCropped, blend: 'difference' }])
    .png()
    .toBuffer()

  const stat = await sharp(diffBuf).stats()
  const rgbMeans = stat.channels.slice(0, 3).map(c => c.mean)
  const avgDiff = rgbMeans.reduce((a, b) => a + b, 0) / rgbMeans.length
  const score = 1 - avgDiff / 255

  const cwd = getEnv('CWD')
  const designFileName = path.basename(args.file_path, '.zip')
  const diffDest = path.resolve(
    cwd,
    `.sketch-cache/${designFileName}/${artboard.pageName}/${artboard.name}`,
    `compare_${Date.now()}.webp`
  )
  await sharp(diffBuf).linear(20, 0).webp({ quality: 90 }).toFile(diffDest)
  const diffPath = path.relative(cwd, diffDest)

  return JSON.stringify({
    score: Number(score.toFixed(4)),
    similarity: `${(score * 100).toFixed(2)}%`,
    preview: { width: pMeta.width, height: pMeta.height },
    screenshot: { width: sMeta.width, height: sMeta.height },
    comparedRegion: { width, height },
    diffPath
  })
}
