import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ── Path aliases ─────────────────────────────────────────────────────────
  // Use @/ instead of long relative paths like ../../../../
  resolve: {
    alias: {
      '@':         resolve(__dirname, 'src'),
      '@api':      resolve(__dirname, 'src/api'),
      '@components': resolve(__dirname, 'src/components'),
      '@hooks':    resolve(__dirname, 'src/hooks'),
      '@pages':    resolve(__dirname, 'src/pages'),
      '@lib':      resolve(__dirname, 'src/lib'),
      '@styles':   resolve(__dirname, 'src/styles'),
      '@context':  resolve(__dirname, 'src/context'),
      '@data':     resolve(__dirname, 'src/data'),
    },
  },

  // ── Dev server ───────────────────────────────────────────────────────────
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    open: true, // Automatically open browser on dev server start
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },


  clearScreen: false,

  // ── Build optimizations ──────────────────────────────────────────────────
  build: {
    // Target modern browsers that support ES modules
    target: 'es2020',

    // Warn on chunks > 400 kB
    chunkSizeWarningLimit: 400,

    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: React core
          'vendor-react': ['react', 'react-dom'],

          // Vendor: Routing
          'vendor-router': ['react-router-dom'],

          // Vendor: Icons (large library — isolate for better caching)
          'vendor-icons': ['lucide-react'],

          // Vendor: TanStack Query
          'vendor-query': [
            '@tanstack/react-query',
            '@tanstack/react-query-devtools',
          ],
        },
      },
    },
  },
});
