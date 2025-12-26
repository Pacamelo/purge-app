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
  build: {
    outDir: 'dist',
    // Only generate source maps in development to prevent source code exposure
    sourcemap: process.env.NODE_ENV === 'development',
  },
  server: {
    port: 3001,
  },
});
