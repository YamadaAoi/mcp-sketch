import type { SketchHtmlInputSchema } from '@/types'
import type { HtmlArtboard } from '@/utils/zip'

/**
 * 筛选出指定的artboard，若未指定节点信息，则返回第一个artboard
 * @param args - 分析参数
 * @param artboards - 所有artboard
 * @returns 指定的artboard
 */
export function filterArtboards(
  args: SketchHtmlInputSchema,
  artboards?: HtmlArtboard[]
) {
  if (!artboards?.length) {
    throw new Error(`Sketch Html Artboard format error`)
  }
  let filteredArtboards = [...artboards]
  if (args.page_id) {
    filteredArtboards = filteredArtboards.filter(
      item => item.pageObjectID === args.page_id
    )
  } else if (args.page_name) {
    filteredArtboards = filteredArtboards.filter(
      item => item.pageName === args.page_name
    )
  }
  if (args.artboard_id) {
    filteredArtboards = filteredArtboards.filter(
      item => item.objectID === args.artboard_id
    )
  } else if (args.artboard_name) {
    filteredArtboards = filteredArtboards.filter(
      item => item.name === args.artboard_name
    )
  }

  if (!filteredArtboards.length) {
    throw new Error(`Sketch Html Artboard ${args.artboard_id} not found`)
  }

  return filteredArtboards[0]
}
