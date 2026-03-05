import type { RegisterToolParams } from '../types'
import { toolStartSession } from './startSession'

export const tools: RegisterToolParams[] = [toolStartSession()]
