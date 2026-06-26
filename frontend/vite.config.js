import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://93.115.101.110:13697',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://93.115.101.110:13697',
        changeOrigin: true,
      },
    },
  },
})
