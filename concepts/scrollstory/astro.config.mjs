import { defineConfig } from 'astro/config';

// Served at https://<concepts host>/scrollstory/
export default defineConfig({
  base: '/scrollstory/',
  output: 'static',
  trailingSlash: 'ignore',
});
