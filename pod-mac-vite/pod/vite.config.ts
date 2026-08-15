import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const nimApiKey = env.NVIDIA_NIM_API_KEY || env.VITE_NVIDIA_NIM_API_KEY;

    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/nim-api': {
            target: 'https://integrate.api.nvidia.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/nim-api/, '/v1'),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                if (nimApiKey) {
                  proxyReq.setHeader('Authorization', `Bearer ${nimApiKey}`);
                }
                proxyReq.setHeader('Accept', 'application/json');
              });
            },
          },
        },
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              pdf: ['html2canvas', 'jspdf'],
              utils: ['axios'],
            }
          }
        },
        chunkSizeWarningLimit: 1000,
      }
    };
});
