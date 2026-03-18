import type Sketch from '@sketch-hq/sketch-file-format-ts'

/**
 * 从beatmap中提取图片并返回存放路径
 * @param image - 图片引用
 */
export function extractBeatmap(image: Sketch.FileRef | Sketch.DataRef) {
  if (image._class === 'MSJSONFileReference') {
  } else {
    // TODO: 处理 DataRef
    return ''
  }
}
