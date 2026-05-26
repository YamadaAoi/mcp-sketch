import type { HtmlArtboard } from '@/utils/zip'
import type { SketchAnalyzeInputSchema } from '..'

/**
 * 筛选出指定的artboard，若未指定节点信息，则返回第一个artboard
 * @param args - 分析参数
 * @param artboards - 所有artboard
 * @returns 指定的artboard
 */
export function filterArtboards(
  args: SketchAnalyzeInputSchema,
  artboards?: HtmlArtboard[]
) {
  if (!artboards?.length) {
    throw new Error(`Sketch Html Artboard format error`)
  }
  let filteredArtboards = [...artboards]
  if (args.page_name) {
    filteredArtboards = filteredArtboards.filter(
      item => item.pageName === args.page_name
    )
  }
  if (args.artboard_name) {
    filteredArtboards = filteredArtboards.filter(
      item => item.name === args.artboard_name
    )
  }

  if (!filteredArtboards.length) {
    throw new Error(
      `Page: ${args.page_name ?? '-'} & Artboard: ${args.artboard_name ?? '-'} not found! Tip: Run 'npx -y mcp-sketch list -p "${args.file_path}"' to check available page and artboard names.`
    )
  }

  return filteredArtboards[0]
}
