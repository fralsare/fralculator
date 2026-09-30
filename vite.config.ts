import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // relative asset paths so the built app works from file:// in Electron
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 3000, // plotly is big; that is fine here
  },
});
