# Task 1 quickstart links

Result: pass.

Evidence:
- `apps/docs/content/docs/getting-started/meta.json` lists `quickstart` before `easy-api`.
- `apps/docs/src/lib/site.ts` defines `DOCS_PATHS.quickstart` as `/docs/getting-started/quickstart`.
- `apps/docs/src/components/homepage.tsx` primary CTA and first start card use `DOCS_PATHS.quickstart`.
- `apps/docs/content/docs/index.mdx` first Start here link points to `/docs/getting-started/quickstart`.
- `apps/docs/content/docs/getting-started/quickstart.mdx` includes illustrative `sendText` success and auth-failure responses.
