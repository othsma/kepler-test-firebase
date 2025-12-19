import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-ui': ['@headlessui/react', 'lucide-react', 'clsx'],
          'vendor-utils': ['date-fns', 'zustand'],
          'vendor-charts': ['recharts'],
          'vendor-pdf-renderer': ['@react-pdf/renderer'],
          'vendor-pdf-utils': ['html2canvas'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
