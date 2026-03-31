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
        input: {
          mcp: resolve(__dirname, 'src/mcp.ts'),
          cli: resolve(__dirname, 'src/cli.ts')
        },
        output: {
          format: 'es',
          entryFileNames: '[name].js',
          preserveModules: false,
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
