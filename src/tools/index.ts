import type { RegisterToolParams } from '../types'
import { toolInitSession } from './initSession'
import { toolGetNextTask } from './getNextTask'
import { toolMarkComplete } from './markComplete'

export const tools: RegisterToolParams[] = [
  toolInitSession(),
  toolGetNextTask(),
  toolMarkComplete()
]
