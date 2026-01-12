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
    port: 3801,
    proxy: {
      '/api': {
        target: 'http://localhost:3802',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3802',
        changeOrigin: true,
      },
      '/public': {
        target: 'http://localhost:3802',
        changeOrigin: true,
      },
    },
  },
});
