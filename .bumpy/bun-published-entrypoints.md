---
'@open-wa/api': patch
'@open-wa/cli': patch
'@open-wa/client': patch
'@open-wa/config': patch
'@open-wa/core': patch
'@open-wa/decrypt': patch
'@open-wa/domain': patch
'@open-wa/driver-interface': patch
'@open-wa/driver-lightpanda': patch
'@open-wa/driver-playwright': patch
'@open-wa/driver-puppeteer': patch
'@open-wa/hyperemitter': patch
'@open-wa/integration-chatwoot': patch
'@open-wa/integration-cloudflare': patch
'@open-wa/integration-s3': patch
'@open-wa/integration-webhook': patch
'@open-wa/logger': patch
'@open-wa/mcp': patch
'@open-wa/plugin-sdk': patch
'@open-wa/runtime-browser': patch
'@open-wa/runtime-bun': patch
'@open-wa/runtime-core': patch
'@open-wa/runtime-edge': patch
'@open-wa/runtime-node': patch
'@open-wa/schema': patch
'@open-wa/screencaster': patch
'@open-wa/session-sync': patch
'@open-wa/socket-client': patch
'@open-wa/utils': patch
'@open-wa/wa-automate-types-only': patch
---

Keep local Bun development on TypeScript source while publishing entry points that resolve the distributed files. npm packages no longer inherit workspace-only source conditions.
