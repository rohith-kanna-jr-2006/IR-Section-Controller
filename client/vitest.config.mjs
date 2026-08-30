import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      include: '**/*.{jsx,js,ts,tsx}',
    }),
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
  },
});
