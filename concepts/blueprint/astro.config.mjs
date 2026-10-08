import { defineConfig } from 'astro/config';

// Served at https://<concepts host>/blueprint/
export default defineConfig({
  base: '/blueprint/',
  output: 'static',
  trailingSlash: 'ignore',
});
