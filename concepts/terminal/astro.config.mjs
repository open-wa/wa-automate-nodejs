import { defineConfig } from 'astro/config';

// Served at https://<concepts host>/terminal/
export default defineConfig({
  base: '/terminal/',
  output: 'static',
  trailingSlash: 'ignore',
});
