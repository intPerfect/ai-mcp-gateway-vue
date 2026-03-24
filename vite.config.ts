import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [vue()],
    server: {
      port: 5173,
      host: '127.0.0.1',
      open: false,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8777',
          changeOrigin: true
        },
        '/api-gateway': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8777',
          changeOrigin: true
        },
        '/ws': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8777',
          changeOrigin: true,
          ws: true
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      },
      rollupOptions: {
        output: {
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: '[ext]/[name]-[hash].[ext]',
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            arco: ['@arco-design/web-vue']
          }
        }
      }
    }
  }
})
