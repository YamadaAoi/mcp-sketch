import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    watch: false,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/tests/',
        '**/*.config.{ts,js,mjs,cjs}'
      ]
    },
    include: ['src/tests/**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules/', 'dist/'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: true,
    pool: 'threads',
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/results.json'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tests': resolve(__dirname, 'src/tests')
    }
  },
  esbuild: {
    target: 'node18',
    format: 'esm'
  }
})
