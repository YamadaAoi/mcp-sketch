import type { RegisterToolParams } from '@/types'
import { toolSketchHtmlAnalyze } from './sketchHtmlAnalyze'

export const tools: RegisterToolParams[] = [toolSketchHtmlAnalyze()]
