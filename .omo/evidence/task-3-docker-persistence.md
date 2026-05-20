# Task 3 Docker persistence

Result: pass.

`docker.mdx` and `security-and-deployment.mdx` both pair the mounted `./sessions:/sessions` volume with `WA_USER_DATA_DIR=/sessions/<sessionId>`. `apps/docs/public/llms-install.md` now follows the same source-backed pattern with `/sessions/default`, `WA_SESSION_ID=default`, and `WA_USER_DATA_DIR=/sessions/default` instead of `/root/.open-wa`. `docker.mdx` includes a restart/no-QR local verification checklist and labels output as illustrative, not captured.
