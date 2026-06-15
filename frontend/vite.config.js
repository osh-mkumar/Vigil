import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default {
  plugins: [react()],
  base: './', // Use relative paths for Chrome extension
  build: {
    outDir: '../extension/dashboard',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        popup: resolve(__dirname, 'popup.html')
      }
    }
  }
};
