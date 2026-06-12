import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    proxy: {
      // Proxy V2 API requests to Next.js backend
      '/api/v2': {
        target: 'http://localhost:3000/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v2/, ''),
      },
      // Proxy Legacy API requests to Laravel backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy Sanctum CSRF cookie requests
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy storage files (images)
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // NOTE: /car/* images are served from frontend/public/car/ by Vite's
      // own static file server — no proxy needed. Proxying /car to Laravel
      // would hijack these requests and cause broken image URLs.
    },
  },
})
