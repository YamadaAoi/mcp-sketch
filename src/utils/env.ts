import { z } from 'zod'

const envSchema = z.object({
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  CWD: z.string().default(process.cwd()),
  SERVER_COMMAND: z.string().default('npm run dev'),
  PREVIEW_URL: z.string().optional(),
  ASSETS_PATH: z.string().default('src/assets/sketch'),
  DESIGN_MEMO_MAX: z.coerce.number().int().min(1).default(8),
  /** 重复图层折叠开关：off/0/false 关闭，其余值（含缺省）开启 */
  LAYER_DEDUP: z.string().default('')
})

export type Env = z.infer<typeof envSchema>

let parsedEnv: Env | undefined

export function getEnv<T extends keyof Env>(key: T): Env[T] {
  parsedEnv ??= envSchema.parse(process.env)
  return parsedEnv[key]
}
