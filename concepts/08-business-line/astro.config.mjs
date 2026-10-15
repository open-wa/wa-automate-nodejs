import { defineConfig } from "astro/config";

// Served under /08-business-line/ beside the other concepts, so every asset URL has to
// go through import.meta.env.BASE_URL. compressHTML is off because it removes
// the spaces between inline elements written on separate lines.
export default defineConfig({
  base: "/08-business-line/",
  output: "static",
  site: process.env.CONCEPTS_SITE || "https://concepts.example.com",
  trailingSlash: "ignore",
  compressHTML: false,
  build: { inlineStylesheets: "auto" },
});
