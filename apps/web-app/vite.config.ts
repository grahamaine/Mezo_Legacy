import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['mezo-icon.svg', 'favicon.ico'],

      // ── Web App Manifest ──────────────────────────────────────────
      manifest: {
        name:             'Mezo Legacy',
        short_name:       'Mezo Legacy',
        description:      'Bitcoin Layer 2 — Vault & Staking on Mezo Network',
        theme_color:      '#7c6ef7',
        background_color: '#0a0b0f',
        display:          'standalone',
        orientation:      'portrait-primary',
        start_url:        '/',
        scope:            '/',
        lang:             'en',
        categories:       ['finance', 'utilities'],
        icons: [
          {
            src:   '/mezo-icon.svg',
            sizes: 'any',
            type:  'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src:   '/icons/icon-192.png',
            sizes: '192x192',
            type:  'image/png',
            purpose: 'any',
          },
          {
            src:   '/icons/icon-512.png',
            sizes: '512x512',
            type:  'image/png',
            purpose: 'any maskable',
          },
        ],
        screenshots: [
          {
            src:   '/mezo-icon.svg',
            sizes: '512x512',
            type:  'image/svg+xml',
            form_factor: 'wide',
            label: 'Mezo Legacy Dashboard',
          },
        ],
      },

      // ── Workbox service worker config ─────────────────────────────
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            // Cache Mezo RPC calls for offline resilience
            urlPattern: /^https:\/\/rpc\.test\.mezo\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName:         'mezo-rpc-cache',
              expiration:        { maxEntries: 10, maxAgeSeconds: 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Cache CoinGecko price data (60s)
            urlPattern: /^https:\/\/api\.coingecko\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName:         'coingecko-cache',
              expiration:        { maxEntries: 5, maxAgeSeconds: 60 },
              networkTimeoutSeconds: 4,
            },
          },
        ],
      },

      devOptions: {
        enabled: true,   // enables PWA in dev so you can test installation locally
      },
    }),
  ],

  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    host: true,
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-wagmi':  ['wagmi', 'viem', '@tanstack/react-query'],
          'vendor-charts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
