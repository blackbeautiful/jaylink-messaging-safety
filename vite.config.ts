import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base path for production deployment
  base: '/',

  // Development server config
  server: {
    host: '::',
    port: 8080,
  },

  // Build options for production
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    // Optimize build for production
    minify: mode === 'production' ? 'esbuild' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', '@tanstack/react-query'],
        },
      },
    },
  },

  // Plugins configuration
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        exportType: 'named',
        ref: true,
      },
    }),
    // Only use component tagger in development
    mode === 'development' && componentTagger(),
  ].filter(Boolean),

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
