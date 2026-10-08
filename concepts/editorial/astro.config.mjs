import { defineConfig } from 'astro/config';

// Served at https://<concepts host>/editorial/
export default defineConfig({
  base: '/editorial/',
  output: 'static',
  trailingSlash: 'ignore',
});
