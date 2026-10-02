import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    // Small icons get inlined; photos and the video stay as cacheable files.
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks that rarely change between deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('dexie')) return 'dexie'
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
        },
      },
    },
  },
})
