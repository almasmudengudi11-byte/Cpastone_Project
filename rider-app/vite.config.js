import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
  preview: {
    allowedHosts: [
      'capstone-rider-app.onrender.com',
      'capstone-driver-app.onrender.com',
      'capstone-rider-app.vercel.app',
      'capstone-driver-app.vercel.app'
    ],
  },
})
