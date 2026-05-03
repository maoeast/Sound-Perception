import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  server: {
    host: '0.0.0.0',
    port: 1420,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 1420,
    strictPort: true,
  },
})
