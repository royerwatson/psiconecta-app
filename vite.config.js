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
          // LandingPage en chunk nombrado para poder hacer modulepreload en index.html
          'page-landing':    ['./src/pages/public/LandingPage.jsx'],
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-recharts': ['recharts'],
          'vendor-dates':    ['date-fns'],
          'vendor-ui':       ['react-hot-toast', 'zustand'],
          'vendor-icons':    ['lucide-react'],
          // Datos clínicos pesados — se cargan solo cuando el terapeuta los necesita
          // (dsm5tr y cie11 ya NO van en el bundle: se sirven desde la
          //  Edge Function clinical-content, protegida con is_pro_therapist)
          'data-clinical':   [
            './src/data/therapeuticLibrary.js',
            './src/data/therapeuticProtocols.js',
          ],
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
