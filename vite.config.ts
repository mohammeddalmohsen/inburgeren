import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon-192.png', 'icon-512.png', 'maskable-512.png'],
      manifest: {
        name: 'NT2 Lezen B1 — Documented Exam Lab',
        short_name: 'Lezen B1',
        description: 'تدريب موثق على نماذج Lezen B1 مع النص والأسئلة والاختيارات المتاحة رسميًا.',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#2e1065',
        background_color: '#f8f7fc',
        start_url: './#/home',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
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
              cacheName: 'nt2-source-pdfs',
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
