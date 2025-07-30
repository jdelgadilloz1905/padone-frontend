import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false
    }
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  // Alias para importaciones más limpias (habilitado para Fase 4)
  resolve: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@pages': './src/pages',
      '@services': './src/services',
      '@hooks': './src/hooks',
      '@utils': './src/utils',
      '@layouts': './src/layouts',
      '@routes': './src/routes',
      '@theme': './src/theme'
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      '@mui/material', 
      '@mui/icons-material',
      '@tanstack/react-query',
      'react-router-dom',
      'axios',
      'date-fns'
    ],
    exclude: ['@react-google-maps/api']
  },
  define: {
    global: 'globalThis',
  }
})
