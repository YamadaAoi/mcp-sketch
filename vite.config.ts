import { defineConfig } from 'vite'
import { resolve } from 'path'
import pkg from './package.json' with { type: 'json' }

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    define: {
      __VERSION__: JSON.stringify(pkg.version)
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      },
      conditions: ['node']
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
      ssr: true,
      rollupOptions: {
        external: [
          /^node:.*/,
          'path',
          'fs',
          'os',
          'crypto',
          'stream',
          'events',
          'util',
          'http',
          'https',
          'zlib'
        ],
        output: {
          preserveModules: false,
          inlineDynamicImports: true,
          sourcemap: false,
          interop: 'auto'
        }
      }
    },
    optimizeDeps: {
      noDiscovery: true // 禁止预打包依赖，因为 Node 环境不需要
    }
  }
})
