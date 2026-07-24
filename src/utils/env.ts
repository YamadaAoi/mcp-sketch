import { z } from 'zod'

const envSchema = z.object({
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  CWD: z.string().default(process.cwd()),
  SERVER_COMMAND: z.string().default('npm run dev'),
  ASSETS_PATH: z.string().default('src/assets/sketch')
})

export type Env = z.infer<typeof envSchema>

export function getEnv<T extends keyof Env>(key: T): Env[T] {
  return envSchema.parse(process.env)[key]
}
