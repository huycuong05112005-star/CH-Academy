/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Alias '@' trỏ vào thư mục src, dùng thay cho đường dẫn tương đối dài
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Proxy tự động: mọi request /api/* được chuyển đến backend
    // Giúp tránh vấn đề CORS trong khi phát triển
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8088',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('three')) {
            return 'three-vendor'
          }
        },
      },
    },
  },
  // ----- Cấu hình Vitest -----
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    testTimeout: 15000,
    pool: 'threads',
  },
})
