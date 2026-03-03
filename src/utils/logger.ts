import { existsSync, mkdirSync, appendFileSync } from 'node:fs'
import { dirname } from 'node:path'
import {
  getConfigManager,
  type LoggerConfig,
  LogLevel,
  parseLogLevel
} from './config'

interface LogEntry {
  timestamp: string
  level: string
  message: string
  data?: unknown
}

const CONSOLE_COLORS = {
  [LogLevel.DEBUG]: '90',
  [LogLevel.INFO]: '36',
  [LogLevel.WARN]: '33',
  [LogLevel.ERROR]: '31'
} as const

const LOG_FILE_EXTENSION = '.log' as const
const DATE_SEPARATOR = '-' as const

export class Logger {
  #level: LogLevel
  #logFile: string | null
  #logFileBase: string
  #currentDate: string
  #enableConsole: boolean
  #enableFile: boolean

  constructor(options?: LoggerConfig) {
    const config = getConfigManager()

    this.#level = options?.level
      ? parseLogLevel(options.level)
      : config.logLevel
    this.#logFileBase = options?.logFile ?? config.logFile
    this.#enableConsole = options?.enableConsole ?? config.enableConsole
    this.#enableFile = options?.enableFile ?? config.enableFile
    this.#currentDate = this.#getCurrentDate()
    this.#logFile = this.#generateLogFilePath()

    if (this.#enableFile && this.#logFile) {
      this.#ensureLogDirectory()
    }
  }

  #ensureLogDirectory(): void {
    if (this.#logFile) {
      const dir = dirname(this.#logFile)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    }
  }

  #getCurrentDate(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  #generateLogFilePath(): string {
    const baseName = this.#logFileBase.replace(
      new RegExp(`${LOG_FILE_EXTENSION}$`),
      ''
    )
    return `${baseName}${DATE_SEPARATOR}${this.#currentDate}${LOG_FILE_EXTENSION}`
  }

  #checkDateChange(): void {
    const newDate = this.#getCurrentDate()
    if (newDate !== this.#currentDate) {
      this.#currentDate = newDate
      this.#logFile = this.#generateLogFilePath()
      this.#ensureLogDirectory()
    }
  }

  #formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp
    const level = entry.level.padEnd(5)
    const message = entry.message

    if (entry.data) {
      return `[${timestamp}] [${level}] ${message}\n${JSON.stringify(entry.data, null, 2)}`
    }

    return `[${timestamp}] [${level}] ${message}`
  }

  #log(level: LogLevel, message: string, data?: unknown): void {
    if (level < this.#level) {
      return
    }

    if (this.#enableFile) {
      this.#checkDateChange()
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      data
    }

    const formatted = this.#formatLogEntry(entry)

    if (this.#enableConsole) {
      const color = this.#getConsoleColor(level)
      console.error(`\x1b[${color}m${formatted}\x1b[0m`)
    }

    if (this.#enableFile && this.#logFile) {
      try {
        appendFileSync(this.#logFile, formatted + '\n')
      } catch (error) {
        console.error('Failed to write to log file:', error)
      }
    }
  }

  #getConsoleColor(level: LogLevel): string {
    return CONSOLE_COLORS[level] ?? '0'
  }

  debug(message: string, data?: unknown): void {
    this.#log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: unknown): void {
    this.#log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: unknown): void {
    this.#log(LogLevel.WARN, message, data)
  }

  error(message: string, data?: unknown): void {
    this.#log(LogLevel.ERROR, message, data)
  }

  setLevel(level: LogLevel | string): void {
    this.#level = parseLogLevel(level)
  }

  getLevel(): LogLevel {
    return this.#level
  }
}

let globalLogger: Logger | null = null

export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger()
  }
  return globalLogger
}
