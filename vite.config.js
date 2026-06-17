import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // react-grid-layout et react-draggable utilisent process.env.NODE_ENV
    // Vite ne le polyfille pas automatiquement (contrairement à webpack)
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
})
