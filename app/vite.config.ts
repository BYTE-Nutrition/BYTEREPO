import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'

/** Shared dev + preview proxy (realtime-proxy on port 5050). */
const apiProxy: Record<string, string | ProxyOptions> = {
  '/realtime/session': {
    target: 'http://localhost:5050',
    changeOrigin: true,
  },
  '/meal-parse': {
    target: 'http://localhost:5050',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
})
