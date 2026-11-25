import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Адрес backend можно переопределить (используется в E2E-тестах)
const apiUrl = process.env.API_URL || 'http://localhost:3000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.CLIENT_PORT) || 5173,
    proxy: { '/api': apiUrl },
  },
})
