import { defineConfig } from '@tanstack/react-start/config'

export default defineConfig({
  server: {
    preset: 'static',
    prerender: {
      routes: ['/'],
      crawlLinks: true
    }
  }
})
