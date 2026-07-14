import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Default environment is node (pure logic). UI tests opt into jsdom via a
    // `// @vitest-environment jsdom` docblock at the top of the file.
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/game/**/*.ts', 'src/lib/**/*.ts', 'src/services/storage.ts'],
      exclude: ['src/game/useGameState.ts'],
      reporter: ['text', 'html'],
    },
  },
})
