import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  base: '/inburgeren/',
  publicDir: 'public-site',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon-192.png', 'icon-512.png', 'maskable-512.png'],
      manifest: {
        name: 'NT2 Lezen B1 — Exam Lab 2023–2025',
        short_name: 'Lezen B1',
        description: 'تدريب موثق على نماذج Lezen B1 الرسمية للأعوام 2023 و2024 و2025.',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#2e1065',
        background_color: '#f8f7fc',
        start_url: '/inburgeren/#/home',
        scope: '/inburgeren/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: { cacheName: 'nt2-pages', networkTimeoutSeconds: 4 }
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.pdf'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'nt2-source-pdfs-2023-2025-v1',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2020',
    sourcemap: process.env.VITE_ENABLE_SOURCEMAPS === 'true',
    cssCodeSplit: true,
    reportCompressedSize: true
  }
});
