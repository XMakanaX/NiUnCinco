/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' en vez de 'autoUpdate' (Fase 13): una recarga automática
      // puede borrar un formulario a medio llenar. El toast de
      // "nueva versión disponible" (src/app/providers.tsx) deja que el
      // usuario decida cuándo recargar.
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest: {
        id: '/',
        name: 'Ni Un Cinco',
        short_name: 'NiUnCinco',
        description: 'Finanzas personales en colones costarricenses',
        lang: 'es-CR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone'],
        orientation: 'portrait',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Registrar gasto',
            short_name: 'Gasto rápido',
            url: '/quick-expense',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // Línea dura de la Fase 13: ninguna respuesta de Supabase (datos
          // de usuario) entra al Cache Storage del service worker — una
          // regla de cache mal escrita ahí podría filtrar datos entre
          // cuentas que comparten el mismo dispositivo/navegador. Esta
          // entrada es redundante con el comportamiento por defecto (nada
          // matchea hoy esas URLs), pero lo deja explícito para quien
          // agregue una regla nueva más adelante.
          {
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'shell' },
          },
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker', 'font', 'image'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
  },
});
