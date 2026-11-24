import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // على ويندوز يشغّل npx/npm أداة Vite من مسار بحرف قرص صغير (c:\...)، فيرى مُجمِّع الحزم
    // React بمسارين مختلفين ويُنتج منه نسختين ⇐ «Invalid hook call». نُجبره على نسخة واحدة.
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
