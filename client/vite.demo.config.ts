import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds a single, self-contained dist-demo/index.html that opens by
// double-click (file://) with NO server — every /api/* call is answered from
// baked-in fixtures (see src/demo/mock.ts). For sharing a click-through
// preview of the whole app to review look & content.
//
//   npm run build:demo   →   client/dist-demo/index.html
export default defineConfig({
  base: './',
  define: {
    'import.meta.env.VITE_DEMO': 'true',
  },
  plugins: [react(), viteSingleFile()],
  assetsInclude: ['**/*.lottie'],
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
    // singlefile inlines everything into one HTML; no manualChunks here.
  },
});
