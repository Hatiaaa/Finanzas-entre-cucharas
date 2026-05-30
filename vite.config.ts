import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-256.png', 'logo-64.png'],
      manifest: {
        name: 'Finanzas Entre Cucharas',
        short_name: 'Entre Cucharas',
        description: 'Sistema de finanzas para el restaurante Entre Cucharas',
        theme_color: '#1A1D2E',
        background_color: '#0E1420',
        display: 'standalone',
        icons: [
          { src: 'logo-64.png',  sizes: '64x64',   type: 'image/png' },
          { src: 'logo-256.png', sizes: '256x256', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true }
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  }
})
