import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
const config = defineConfig({
  base: '/dashboard/',
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    tailwindcss(),
    TanStackRouterVite(),
    viteReact(),
  ],
  build: {
    rollupOptions: {
      external: [
        "@open-wa/schema",
        "@open-wa/utils",
        "@open-wa/config",
        "jiti"
      ],
      onwarn(warning, warn) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes("use client")) {
          return
        }
        warn(warning)
      },
    },
  },
  ssr: {
    noExternal: ['@open-wa/utils', 'jiti']
  }
})

export default config
