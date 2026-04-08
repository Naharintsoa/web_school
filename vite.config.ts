import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // lucide-react retiré de l'exclusion → Vite peut tree-shaker les icônes non utilisées
  build: {
    rollupOptions: {
      output: {
        // Séparer les grosses dépendances en chunks distincts
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':    ['lucide-react'],
          'vendor-xlsx':  ['xlsx'],
        },
      },
    },
    // Alerter si un chunk dépasse 500 KB
    chunkSizeWarningLimit: 500,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
