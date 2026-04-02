import { logger } from './logger'

/**
 * 获取sharp实例
 * 如果sharp不可用，返回null
 * @returns sharp实例
 */
export async function getSharp() {
  try {
    const sharp = await import('sharp')
    return sharp.default
  } catch (err) {
    logger.error(err, 'try to import sharp failed')
    return null
  }
}
