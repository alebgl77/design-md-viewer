import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset URLs so the same build works from a domain root and from a
  // GitHub Pages project subdirectory.
  base: './',
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 600
  }
});
