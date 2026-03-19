import AdmZip from 'adm-zip'
import { logger } from '@/utils/logger'
import {
  resolveArtboardTarget,
  type InputSchema
} from './resolveArtboardTarget'
import { assembleNode } from './assembleNode'

export function sketchAnalyze(args: InputSchema) {
  logger.debug(args, 'resolveArtboardTarget')
  const zip = new AdmZip(args.file_path)
  const nodeInfo = resolveArtboardTarget(args, zip)
  const nodes = assembleNode(nodeInfo, args, zip)
  return nodes
}
