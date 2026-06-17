import { defineConfig } from "vite"
import { fileURLToPath, URL } from "node:url"
import { devtools } from "@tanstack/devtools-vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const appReactPath = (path: string) => fileURLToPath(new URL(`./node_modules/${path}`, import.meta.url))

const config = defineConfig({
  base: '/dashboard/',
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    alias: [
      { find: "react/jsx-runtime", replacement: appReactPath("react/jsx-runtime.js") },
      { find: "react/jsx-dev-runtime", replacement: appReactPath("react/jsx-dev-runtime.js") },
      { find: "react-dom/client", replacement: appReactPath("react-dom/client.js") },
      { find: /^react$/, replacement: appReactPath("react/index.js") },
      { find: /^react-dom$/, replacement: appReactPath("react-dom/index.js") },
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
