import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// GITHUB_PAGES base path is set automatically by the deploy workflow.
// For Quick deploy, base stays as '/'.
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/dinner-app/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      external: ['/client/quick.js']
    }
  }
})
