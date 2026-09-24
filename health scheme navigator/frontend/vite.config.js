import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://savix-tasks-api-9lyi.onrender.com',
        changeOrigin: true,
      }
    }
  }
})

