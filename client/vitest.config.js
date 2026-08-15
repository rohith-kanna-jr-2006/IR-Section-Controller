import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'forks',
    fileParallelism: false
  },
});
