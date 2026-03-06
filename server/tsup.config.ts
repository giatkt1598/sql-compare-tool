import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['cjs'],
  target: 'node20',
  platform: 'node',
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false
});