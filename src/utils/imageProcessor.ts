import { logger } from './logger'

let sharpLoadFailed = false

/**
 * 获取sharp实例
 * 如果sharp不可用，返回null（失败原因只记录一次，避免逐图刷屏）
 * @returns sharp实例
 */
export async function getSharp() {
  try {
    const sharp = await import('sharp')
    return sharp.default
  } catch (err) {
    if (!sharpLoadFailed) {
      sharpLoadFailed = true
      logger.error(err, 'try to import sharp failed')
    }
    return null
  }
}
