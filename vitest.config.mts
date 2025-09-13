import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    server: { deps: { inline: ["convex-test"] } },
    setupFiles: ['./tests/utils/test-setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
});