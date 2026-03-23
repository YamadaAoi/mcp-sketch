import pino from 'pino'

/**
 * 日志记录器
 * @param level - 日志级别，默认值为 "info"，"fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent"
 */
export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info'
  },
  process.stderr
)
