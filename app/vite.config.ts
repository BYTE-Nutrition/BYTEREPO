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
    // Sends /realtime/session to the voice server on port 5050 while you use npm run dev.
    proxy: {
      '/realtime/session': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/realtime/session': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
    },
  },
})
