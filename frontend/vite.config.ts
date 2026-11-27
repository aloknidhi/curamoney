import { defineConfig, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// SPA fallback middleware so React Router works on page reload in dev.
const spaFallbackPlugin = (): PluginOption => ({
  name: 'curamoney-spa-fallback',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (
        req.url?.startsWith('/api') ||
        req.url?.startsWith('/@') ||
        req.url?.startsWith('/src')
      ) {
        return next()
      }
      const accept = req.headers.accept || ''
      if (accept.includes('text/html')) {
        const indexPath = path.resolve(__dirname, 'index.html')
        if (fs.existsSync(indexPath)) {
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          return res.end(fs.createReadStream(indexPath))
        }
      }
      next()
    })
  },
})

export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
})
