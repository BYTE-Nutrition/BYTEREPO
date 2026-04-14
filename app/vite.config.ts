import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    // Proxies to realtime-proxy on port 5050 during npm run dev.
    proxy: {
      '/realtime/session': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/meal-parse': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/meal-parse': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/realtime/session': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/meal-parse': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/meal-parse': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})
