import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

function buildApiProxy(mode: string): Record<string, string | ProxyOptions> {
  const env = loadEnv(mode, path.resolve(__dirname), '')
  const usdaTarget = env.VITE_MEAL_PARSE_USDA_TARGET?.trim().replace(/\/$/, '')

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

  /** Same-origin in dev → Vite forwards to Render; avoids browser CORS on localhost:5173. */
  if (usdaTarget) {
    apiProxy['/meal-parse-usda'] = {
      target: usdaTarget,
      changeOrigin: true,
      rewrite: () => '/meal-parse',
    }
  }

  return apiProxy
}

export default defineConfig(({ mode }) => {
  const apiProxy = buildApiProxy(mode)

  return {
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
  }
})
