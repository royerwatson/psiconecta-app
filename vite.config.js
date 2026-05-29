import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Dividir el bundle en chunks más pequeños para mejorar la carga inicial
    rollupOptions: {
      output: {
        manualChunks: {
          // Librerías de React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase (client + realtime)
          'vendor-supabase': ['@supabase/supabase-js'],
          // Recharts (gráficas)
          'vendor-recharts': ['recharts'],
          // Utilidades de fecha
          'vendor-dates': ['date-fns'],
          // UI y estado
          'vendor-ui': ['react-hot-toast', 'zustand'],
        },
      },
    },
    // Advertir solo si algún chunk supera 800 kB (el daily-js es pesado por diseño)
    chunkSizeWarningLimit: 800,
  },
  server: {
    port: 3000,
    host: true,
  },
})
