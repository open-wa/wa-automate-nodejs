import { defineConfig } from 'astro/config';

// Served at https://<concepts host>/explorer/
export default defineConfig({
  base: '/explorer/',
  output: 'static',
  trailingSlash: 'ignore',
});
