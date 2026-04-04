// vite.config.ts
import { defineConfig, loadEnv } from "file:///D:/Desktop/AI%20MCP%20Gateway/ai-mcp-gateway/ai-mcp-gateway-vue/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/Desktop/AI%20MCP%20Gateway/ai-mcp-gateway/ai-mcp-gateway-vue/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "D:\\Desktop\\AI MCP Gateway\\ai-mcp-gateway\\ai-mcp-gateway-vue";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [vue()],
    server: {
      port: 5173,
      host: "127.0.0.1",
      open: true,
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL || "http://localhost:8777",
          changeOrigin: true
        },
        "/api-gateway": {
          target: env.VITE_BACKEND_URL || "http://localhost:8777",
          changeOrigin: true
        },
        "/ws": {
          target: env.VITE_BACKEND_URL || "http://localhost:8777",
          changeOrigin: true,
          ws: true
        }
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "src")
      }
    },
    build: {
      target: "es2020",
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: mode === "development",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: mode === "production"
        }
      },
      rollupOptions: {
        output: {
          chunkFileNames: "js/[name]-[hash].js",
          entryFileNames: "js/[name]-[hash].js",
          assetFileNames: "[ext]/[name]-[hash].[ext]",
          manualChunks: {
            vue: ["vue", "vue-router", "pinia"],
            arco: ["@arco-design/web-vue"]
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxEZXNrdG9wXFxcXEFJIE1DUCBHYXRld2F5XFxcXGFpLW1jcC1nYXRld2F5XFxcXGFpLW1jcC1nYXRld2F5LXZ1ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcRGVza3RvcFxcXFxBSSBNQ1AgR2F0ZXdheVxcXFxhaS1tY3AtZ2F0ZXdheVxcXFxhaS1tY3AtZ2F0ZXdheS12dWVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L0Rlc2t0b3AvQUklMjBNQ1AlMjBHYXRld2F5L2FpLW1jcC1nYXRld2F5L2FpLW1jcC1nYXRld2F5LXZ1ZS92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpKVxuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW3Z1ZSgpXSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICBob3N0OiAnMTI3LjAuMC4xJyxcbiAgICAgIG9wZW46IHRydWUsXG4gICAgICBwcm94eToge1xuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGVudi5WSVRFX0JBQ0tFTkRfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0Ojg3NzcnLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICAnL2FwaS1nYXRld2F5Jzoge1xuICAgICAgICAgIHRhcmdldDogZW52LlZJVEVfQkFDS0VORF9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODc3NycsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgICcvd3MnOiB7XG4gICAgICAgICAgdGFyZ2V0OiBlbnYuVklURV9CQUNLRU5EX1VSTCB8fCAnaHR0cDovL2xvY2FsaG9zdDo4Nzc3JyxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgd3M6IHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJylcbiAgICAgIH1cbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICAgICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxuICAgICAgc291cmNlbWFwOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnLFxuICAgICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgICBkcm9wX2NvbnNvbGU6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyxcbiAgICAgICAgICBkcm9wX2RlYnVnZ2VyOiBtb2RlID09PSAncHJvZHVjdGlvbidcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdqcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2pzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnW2V4dF0vW25hbWVdLVtoYXNoXS5bZXh0XScsXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgICB2dWU6IFsndnVlJywgJ3Z1ZS1yb3V0ZXInLCAncGluaWEnXSxcbiAgICAgICAgICAgIGFyY286IFsnQGFyY28tZGVzaWduL3dlYi12dWUnXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVgsU0FBUyxjQUFjLGVBQWU7QUFDdlosT0FBTyxTQUFTO0FBQ2hCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxDQUFDO0FBRXZDLFNBQU87QUFBQSxJQUNMLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFBQSxJQUNmLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVEsSUFBSSxvQkFBb0I7QUFBQSxVQUNoQyxjQUFjO0FBQUEsUUFDaEI7QUFBQSxRQUNBLGdCQUFnQjtBQUFBLFVBQ2QsUUFBUSxJQUFJLG9CQUFvQjtBQUFBLFVBQ2hDLGNBQWM7QUFBQSxRQUNoQjtBQUFBLFFBQ0EsT0FBTztBQUFBLFVBQ0wsUUFBUSxJQUFJLG9CQUFvQjtBQUFBLFVBQ2hDLGNBQWM7QUFBQSxVQUNkLElBQUk7QUFBQSxRQUNOO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxNQUNwQztBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFdBQVc7QUFBQSxNQUNYLFdBQVcsU0FBUztBQUFBLE1BQ3BCLFFBQVE7QUFBQSxNQUNSLGVBQWU7QUFBQSxRQUNiLFVBQVU7QUFBQSxVQUNSLGNBQWMsU0FBUztBQUFBLFVBQ3ZCLGVBQWUsU0FBUztBQUFBLFFBQzFCO0FBQUEsTUFDRjtBQUFBLE1BQ0EsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsY0FBYztBQUFBLFlBQ1osS0FBSyxDQUFDLE9BQU8sY0FBYyxPQUFPO0FBQUEsWUFDbEMsTUFBTSxDQUFDLHNCQUFzQjtBQUFBLFVBQy9CO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
