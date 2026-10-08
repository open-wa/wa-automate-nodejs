import { defineConfig } from 'astro/config';

// Served at https://<concepts host>/departures/
export default defineConfig({
  base: '/departures/',
  output: 'static',
  trailingSlash: 'ignore',
});
