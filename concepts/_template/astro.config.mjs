import { defineConfig } from 'astro/config';

// Served at https://<concepts host>/SLUG/
export default defineConfig({
  base: '/SLUG/',
  output: 'static',
  trailingSlash: 'ignore',
});
