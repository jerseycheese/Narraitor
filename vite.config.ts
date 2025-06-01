import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // Add proper path resolution for the @ alias used in the project
      '@': path.resolve(__dirname, './src'),
    },
  }
});