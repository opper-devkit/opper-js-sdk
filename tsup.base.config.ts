import { defineConfig } from 'tsup';

export const BASE_CONFIG = defineConfig({
  entry: ['./src/index.ts'],
  format: ['cjs', 'esm'],
  sourcemap: true,
  clean: true,
  bundle: true,
  minify: false,
  keepNames: true,
  splitting: false,
  dts: true
});
