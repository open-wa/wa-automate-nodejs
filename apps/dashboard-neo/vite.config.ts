import { defineConfig } from "vitest/config"
import { createRequire } from "node:module"
import { devtools } from "@tanstack/devtools-vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const resolvePackageExport = createRequire(import.meta.url).resolve

const config = defineConfig({
  base: '/dashboard/',
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    alias: [
      { find: "react/jsx-runtime", replacement: resolvePackageExport("react/jsx-runtime") },
      { find: "react/jsx-dev-runtime", replacement: resolvePackageExport("react/jsx-dev-runtime") },
      { find: "react-dom/client", replacement: resolvePackageExport("react-dom/client") },
      { find: /^react$/, replacement: resolvePackageExport("react") },
      { find: /^react-dom$/, replacement: resolvePackageExport("react-dom") },
    ],
  },
  plugins: [
    devtools(),
    tailwindcss(),
    TanStackRouterVite(),
    viteReact(),
  ],
  define: {
    'import.meta.env.VITE_EASY_API_PORT': JSON.stringify(process.env.EASY_API_PORT || ''),
    'import.meta.env.VITE_EASY_API_HOST': JSON.stringify(process.env.EASY_API_HOST || ''),
  },
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
  },
  test: {
    environment: "jsdom",
    globals: true,
  }
})

export default config
