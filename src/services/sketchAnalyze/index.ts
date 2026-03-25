import path from 'path'
import { openSketchFile } from '@/utils/sketch'
import { writeJsonFile } from '@/utils/saveFile'
import { resolveArtboardTarget } from './resolveArtboardTarget'
import { assembleNode } from './assembleNode'
import type { InputSchema, SketchPrompt } from '@/types'
import { assembleGlobalResource } from './assembleGlobalResource'

/**
 * 分析sketch文件，提取指定节点数据，存储到指定位置json文件中，返回json文件位置
 * json位置拼接规则：{args.file_path所在文件夹}/{args.file_name无后缀}/{nodeInfo.pageId}_{nodeInfo.artboardId}_{nodeInfo.nodeId(如果有的话)}.json
 * @param args 分析参数
 * @returns json文件位置
 */
export async function handleSketchAnalyze(args: InputSchema) {
  let response = ''

  try {
    const sketchFile = await openSketchFile(args.file_path)

    const nodeInfo = resolveArtboardTarget(args, sketchFile)

    const result = assembleNode(
      nodeInfo.layers,
      sketchFile.images,
      args.assets_path
    )

    const { sharedStyles, symbolMasters } = assembleGlobalResource(
      {
        sharedStyleIDs: result.sharedStyleIDs,
        symbolMasterIDs: result.symbolMasterIDs
      },
      sketchFile,
      args.assets_path
    )

    const prompt: SketchPrompt = {
      meta: {
        description: `This is sanitized structural data from a Sketch design file.
        All frame properties (x, y, w, h) are relative to the parent container.
        Extract the images used to the specified location, please infer the image location reasonably.`
      },
      globalResources: {
        sharedStyles,
        symbolMasters
      },
      layers: result.layers
    }

    if (args.saveResult ?? true) {
      const parsed = path.parse(args.file_path)
      const targetPath = `${parsed.dir}/${parsed.name}/${nodeInfo.pageId}_${nodeInfo.artboardId}_${nodeInfo.nodeId ? nodeInfo.nodeId : 'all'}.json`
      await writeJsonFile(targetPath, prompt)
    }

    response = `Sketch Structure JSON: ${JSON.stringify(prompt)}.`
  } catch (error) {
    response = `Sketch analyze error: ${error instanceof Error ? error.message : 'unknown error'}`
  }

  return response
}
