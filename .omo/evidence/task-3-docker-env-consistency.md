# Task 3 Docker env consistency

Result: pass.

`docker.mdx`, `configuration-and-cli.mdx`, and `security-and-deployment.mdx` consistently use `WA_*` runtime env names. `docker.mdx` explicitly says bare `PORT`, `API_KEY`, and `SESSION_ID` are not documented as v5 config env vars.
