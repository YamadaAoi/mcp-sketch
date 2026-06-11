import { defineConfig } from 'tsup'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  dts: false,
  sourcemap: false,
  clean: true,
  splitting: false,
  bundle: true,
  minify: true,
  define: {
    __VERSION__: JSON.stringify(pkg.version)
  },
  external: [/^node:.*/, 'sharp'],
  esbuildOptions(options) {
    options.alias = {
      '@': resolve(__dirname, 'src')
    }
    options.loader = {
      ...options.loader,
      '.md': 'text'
    }
  }
})
