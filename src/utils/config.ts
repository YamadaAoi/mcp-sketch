import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const LOG_LEVEL_MAPPING = {
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARN: LogLevel.WARN,
  ERROR: LogLevel.ERROR
} as const

interface LoggerConfig {
  level?: LogLevel | string
  logFile?: string | null
  enableConsole?: boolean
  enableFile?: boolean
}

interface MCPConfig {
  cwd?: string
  logging?: LoggerConfig
}

function logWarn(message: string, data?: unknown): void {
  console.warn(`[Config] ${message}`, data ?? '')
}

function logInfo(message: string, data?: unknown): void {
  console.log(`[Config] ${message}`, data ?? '')
}

function parseLogLevel(level: LogLevel | string): LogLevel {
  if (typeof level === 'number') {
    return level
  }

  const upperLevel = level.toUpperCase()
  return (
    LOG_LEVEL_MAPPING[upperLevel as keyof typeof LOG_LEVEL_MAPPING] ??
    LogLevel.INFO
  )
}

function parseCommandLineArgs(): MCPConfig {
  const args = process.argv.slice(2)
  const config: MCPConfig = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg.startsWith('--cwd=')) {
      config.cwd = arg.split('=')[1]
    } else if (arg.startsWith('--level=')) {
      config.logging = config.logging || {}
      config.logging.level = arg.split('=')[1]
    } else if (arg.startsWith('--log-file=')) {
      config.logging = config.logging || {}
      const logFile = arg.split('=')[1]
      config.logging.logFile = logFile === 'null' ? null : logFile
    } else if (arg === '--no-console') {
      config.logging = config.logging || {}
      config.logging.enableConsole = false
    } else if (arg === '--no-file') {
      config.logging = config.logging || {}
      config.logging.enableFile = false
    }
  }

  return config
}

class ConfigManager {
  #config: MCPConfig
  #cwd: string

  constructor() {
    this.#config = parseCommandLineArgs()
    this.#cwd = this.#resolveCwd()
    logInfo('Config loaded', {
      cwd: this.#cwd,
      logLevel: this.logLevel,
      logFile: this.logFile,
      enableConsole: this.enableConsole,
      enableFile: this.enableFile
    })
  }

  #resolveCwd(): string {
    const configuredCwd = this.#config.cwd

    if (configuredCwd) {
      const resolvedCwd = resolve(configuredCwd)
      if (existsSync(resolvedCwd)) {
        return resolvedCwd
      }
      logWarn(
        `Configured cwd does not exist: ${configuredCwd}, using process.cwd()`
      )
    }

    return process.cwd()
  }

  #resolveLogFile(logFile: string | null | undefined): string {
    if (logFile === null) {
      return ''
    }

    const logFilePath = logFile || 'logs/mcp-vue.log'

    if (logFilePath.startsWith('/') || /^[A-Za-z]:/.test(logFilePath)) {
      return logFilePath
    }

    return resolve(this.#cwd, logFilePath)
  }

  get cwd(): string {
    return this.#cwd
  }

  get logging(): LoggerConfig | null {
    return this.#config.logging || null
  }

  get logLevel(): LogLevel {
    return parseLogLevel(this.logging?.level ?? 'INFO')
  }

  get logFile(): string {
    return this.#resolveLogFile(this.logging?.logFile)
  }

  get enableConsole(): boolean {
    return this.logging?.enableConsole ?? true
  }

  get enableFile(): boolean {
    return this.logging?.enableFile ?? true
  }

  reload(): void {
    this.#config = parseCommandLineArgs()
    this.#cwd = this.#resolveCwd()
  }
}

let configManagerInstance: ConfigManager | null = null

export function getConfigManager(): ConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager()
  }
  return configManagerInstance
}

export type { LoggerConfig, MCPConfig }
export { LogLevel, LOG_LEVEL_MAPPING, parseLogLevel }
