// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer'; // optional
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteCompression(), // compress assets with gzip
    visualizer({ open: false }) // optional: analyze bundle sizes
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInclude: ['**/*.lottie'],
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('react-router')) return 'vendor-router';
            return 'vendor';
          }
        }
      }
    }
  }
});
