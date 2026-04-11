import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://backend:3000',
        secure: false,
      },
      '/socket.io': {
        target: 'https://backend:3000',
        ws: true,
        secure: false,
      }
    }
  }
})
