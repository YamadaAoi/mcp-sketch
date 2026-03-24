import { describe, it, expect, beforeAll } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { handleSketchHtmlAnalyze } from '@/services/sketchHtmlAnalyze/index'
import type { SketchHtmlInputSchema } from '@/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('handleSketchHtmlAnalyze real file test', () => {
  const fixturesDir = path.resolve(__dirname, '../fixtures')
  const sketchHtmlFilePath = path.resolve(fixturesDir, '登录 2html.zip')
  const outputDir = path.resolve(fixturesDir, '登录 2html_output')

  beforeAll(async () => {
    const sketchExists = await fs
      .access(sketchHtmlFilePath)
      .then(() => true)
      .catch(() => false)
    if (!sketchExists) {
      throw new Error(`Test fixture not found: ${sketchHtmlFilePath}`)
    }
    await fs.rm(outputDir, { recursive: true, force: true })
  })

  it('should parse sketch html file and generate json', async () => {
    const args: SketchHtmlInputSchema = {
      file_path: sketchHtmlFilePath
    }

    const result = await handleSketchHtmlAnalyze(args)
    console.log('Result:', result)

    expect(result).toBeDefined()
    expect(result).toContain('.json')
    expect(result).toContain('登录 2html')
  })

  it('should filter by page_name and generate correct json', async () => {
    const args: SketchHtmlInputSchema = {
      file_path: sketchHtmlFilePath,
      page_name: '页面 1'
    }

    const result = await handleSketchHtmlAnalyze(args)
    console.log('Result with page_name:', result)

    expect(result).toContain('.json')
    expect(result).toContain('页面 1')
  })

  it('should filter by artboard_name', async () => {
    const args: SketchHtmlInputSchema = {
      file_path: sketchHtmlFilePath,
      artboard_name: '00 _登录页'
    }

    const result = await handleSketchHtmlAnalyze(args)
    console.log('Result with artboard_name:', result)

    expect(result).toContain('.json')
    expect(result).toContain('00 _登录页')
  })

  it('should return error for invalid page_name', async () => {
    const args: SketchHtmlInputSchema = {
      file_path: sketchHtmlFilePath,
      page_name: 'NonExistentPage'
    }

    const result = await handleSketchHtmlAnalyze(args)
    expect(result).toContain('error')
    expect(result).toContain('not found')
  })

  it('should return error for invalid artboard_name', async () => {
    const args: SketchHtmlInputSchema = {
      file_path: sketchHtmlFilePath,
      artboard_name: 'NonExistentArtboard'
    }

    const result = await handleSketchHtmlAnalyze(args)
    expect(result).toContain('error')
    expect(result).toContain('not found')
  })

  it('should include preview image when available', async () => {
    const args: SketchHtmlInputSchema = {
      file_path: sketchHtmlFilePath,
      artboard_name: '00 _登录页'
    }

    const result = await handleSketchHtmlAnalyze(args)
    console.log('Result with preview:', result)

    expect(result).toContain('preview image')
    expect(result).toContain('.png')
  })

  it('should generate correct json content', async () => {
    const args: SketchHtmlInputSchema = {
      file_path: sketchHtmlFilePath,
      artboard_name: '00 _登录页'
    }

    const result = await handleSketchHtmlAnalyze(args)

    const jsonPath = result
      .replace(
        'Please use appropriate shell commands to read the complete design structure JSON file: ',
        ''
      )
      .split('.preview image:')[0]
    const content = await fs.readFile(jsonPath, 'utf8')
    const data = JSON.parse(content)

    expect(data.meta).toBeDefined()
    expect(data.meta.description).toContain('Sketch design file')
    expect(data.artboard).toBeDefined()
    expect(data.artboard.name).toBe('00 _登录页')
    expect(data.artboard.pageName).toBe('页面 1')
    expect(data.artboard.width).toBe(1920)
    expect(data.artboard.height).toBe(1080)
    expect(data.artboard.layers.length).toBeGreaterThan(0)
  })

  it('should extract layer assets correctly', async () => {
    const args: SketchHtmlInputSchema = {
      file_path: sketchHtmlFilePath,
      artboard_name: '00 _登录页'
    }

    const result = await handleSketchHtmlAnalyze(args)

    const jsonPath = result
      .replace(
        'Please use appropriate shell commands to read the complete design structure JSON file: ',
        ''
      )
      .split('.preview image:')[0]
    const content = await fs.readFile(jsonPath, 'utf8')
    const data = JSON.parse(content)

    const layersWithAssets = data.artboard.layers.filter(
      (l: any) => l.assets && l.assets.length > 0
    )
    console.log('Layers with assets:', layersWithAssets.length)

    expect(layersWithAssets.length).toBeGreaterThan(0)
    const firstLayerWithAssets = layersWithAssets[0]
    expect(firstLayerWithAssets.assets[0].path).toBeDefined()
    console.log('Asset path:', firstLayerWithAssets.assets[0].path)
  })
})
