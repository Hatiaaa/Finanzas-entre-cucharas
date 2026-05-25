import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.jpg'],
        manifest: {
          name: 'Finanzas Entre Cucharas',
          short_name: 'Entre Cucharas',
          description: 'Sistema de finanzas para el restaurante Entre Cucharas',
          theme_color: '#0B131F',
          background_color: '#0B131F',
          display: 'standalone',
          icons: [
            {
              src: 'logo.jpg',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: 'logo.jpg',
              sizes: '512x512',
              type: 'image/jpeg'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
