import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Scope coverage to the backend surface the test suite exercises (API
      // route handlers + auth callback). UI components have no unit tests, so
      // measuring them would only produce a meaningless global percentage.
      include: ['src/app/api/**', 'src/app/auth/**'],
      reporter: ['text', 'html'],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 90,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
