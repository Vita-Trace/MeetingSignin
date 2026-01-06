import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5179,
    allowedHosts: true,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  }
})
