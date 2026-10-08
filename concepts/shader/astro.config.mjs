import { defineConfig } from 'astro/config';

// Served at https://<concepts host>/shader/
export default defineConfig({
  base: '/shader/',
  output: 'static',
  trailingSlash: 'ignore',
});
