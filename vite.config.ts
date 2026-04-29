import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Required by @coral-xyz/anchor when running in the browser
    'process.env.ANCHOR_BROWSER': JSON.stringify('true'),
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  resolve: {
    alias: {
      // Point Node's "buffer" to the browser-compatible npm package
      buffer: 'buffer',
    },
  },
})
