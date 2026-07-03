import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoName = 'FocusLedger';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/FocusLedger/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
  },
}));
