import { homedir } from 'os'
import { join } from 'path'
import { z } from 'zod'

function toNumber(str?: string | number) {
  if (typeof str !== 'string') {
    return str
  }
  const num = Number(str)
  return isNaN(num) ? str : num
}

const envSchema = z.object({
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  CWD: z.string().default(process.cwd()),
  SERVER_COMMAND: z.string().default('npm run dev'),
  CHROME_PATH: z.string().default(''),
  USER_DATA_DIR: z.string().default(join(homedir(), '.mcp-sketch-chrome-data')),
  DEBUG_PORT: z.number().default(9222),
  ASSETS_PATH: z.string().default('src/assets/sketch')
})

export type Env = z.infer<typeof envSchema>

function parseEnv(): Env {
  return envSchema.parse({
    ...process.env,
    DEBUG_PORT: toNumber(process.env.DEBUG_PORT)
  })
}

export function getEnv<T extends keyof Env>(key: T): Env[T] {
  return parseEnv()[key]
}
