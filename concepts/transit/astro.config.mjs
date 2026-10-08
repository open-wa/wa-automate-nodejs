import { defineConfig } from 'astro/config';

// Served at https://<concepts host>/transit/
export default defineConfig({
  base: '/transit/',
  output: 'static',
  trailingSlash: 'ignore',
});
