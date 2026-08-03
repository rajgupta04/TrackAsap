import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // ── Pre-bundle heavy deps at dev startup so first-load is fast ─────────────
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'recharts',
      'zustand',
      'axios',
    ],
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    // Raise warning limit (codemirror bundles are intentionally large)
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // ── Manual chunk splitting — explicit priority ordering avoids circular deps ─
        manualChunks(id) {
          // React core — smallest, most-cached chunk (highest priority check)
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }

          // React Router — grouped separately (changes independently)
          if (id.includes('/node_modules/react-router') || id.includes('/node_modules/@remix-run/')) {
            return 'vendor-router';
          }

          // Code editor — only needed on Playground / Problems / Sheets (largest chunk, load on demand)
          if (
            id.includes('/node_modules/@codemirror/') ||
            id.includes('/node_modules/@uiw/react-codemirror') ||
            id.includes('/node_modules/@uiw/codemirror-theme') ||
            id.includes('/node_modules/@lezer/') ||
            id.includes('/node_modules/js-beautify/') ||
            id.includes('/node_modules/prismjs/')
          ) {
            return 'vendor-editor';
          }

          // Charts — only needed on analytics / dashboard
          if (
            id.includes('/node_modules/recharts/') ||
            id.includes('/node_modules/d3-') ||
            id.includes('/node_modules/victory-')
          ) {
            return 'vendor-charts';
          }

          // Framer Motion — animations, shared across pages
          if (id.includes('/node_modules/framer-motion/')) {
            return 'vendor-framer';
          }

          // Utility libs — small, shared
          if (
            id.includes('/node_modules/zustand/') ||
            id.includes('/node_modules/axios/') ||
            id.includes('/node_modules/date-fns/') ||
            id.includes('/node_modules/lucide-react/') ||
            id.includes('/node_modules/react-hot-toast/') ||
            id.includes('/node_modules/canvas-confetti/') ||
            id.includes('/node_modules/localforage/') ||
            id.includes('/node_modules/uuid/')
          ) {
            return 'vendor-utils';
          }
          // All remaining node_modules fall through to Rollup's auto-chunking
          // (avoids circular chunk issues from forced catch-all grouping)
        },
      },
    },
  },
});
