// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [
    react(),   
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
