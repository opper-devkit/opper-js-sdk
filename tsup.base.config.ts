import { defineConfig } from 'tsup';

export const BASE_CONFIG = defineConfig({
  entry: ['./src/**/*.ts'],
  format: ['cjs', 'esm'],
  sourcemap: true,
  clean: true,
  bundle: false,
  minify: false,
  keepNames: true,
  splitting: false,
  dts: true
});
