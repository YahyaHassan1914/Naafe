import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000', // <-- your backend port
    },
  },
  optimizeDeps: {
    include: ['lucide-react'],
  },
  build: {
    // Modern build optimizations
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true
  }
});
