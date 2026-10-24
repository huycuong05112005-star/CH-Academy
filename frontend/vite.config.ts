/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
        target: process.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  // ----- Cấu hình Vitest -----
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
