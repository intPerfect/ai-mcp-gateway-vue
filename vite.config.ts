import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8777',
        changeOrigin: true,
      },
      '/api-gateway': {
        target: 'http://localhost:8777',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8777',
        changeOrigin: true,
        ws: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
