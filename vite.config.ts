import { defineConfig } from 'vite'
import { resolve } from 'path'
import pkg from './package.json' with { type: 'json' }

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    define: {
      __VERSION__: JSON.stringify(pkg.version)
    },
    build: {
      target: 'node18',
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        fileName: 'index',
        formats: ['es']
      },
      outDir: 'dist',
      emptyOutDir: true,
      minify: isProduction,
      sourcemap: !isProduction,
      rollupOptions: {
        external: [/^node:.*/],
        output: {
          preserveModules: false,
          inlineDynamicImports: true
        }
      }
    }
  }
})
