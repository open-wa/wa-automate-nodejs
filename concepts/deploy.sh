#!/usr/bin/env bash
# Build every committed concept, then publish concepts/_site with wrangler.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if grep -q "REPLACE_WITH_CLOUDFLARE_ACCOUNT_ID" "$HERE/wrangler.toml"; then
  echo "Fill in account_id in concepts/wrangler.toml first." >&2
  exit 1
fi
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "Set CLOUDFLARE_API_TOKEN (Workers Scripts:Edit, Workers Routes:Edit)." >&2
  exit 1
fi

bash "$HERE/build-all.sh"

count=$(find "$HERE/_site" -mindepth 2 -maxdepth 2 -name index.html | wc -l | tr -d ' ')
if [ "$count" -eq 0 ] || [ ! -f "$HERE/_site/index.html" ]; then
  echo "Site is empty. Refusing to publish." >&2
  exit 1
fi

cd "$HERE"
pnpm dlx wrangler@4.143.0 deploy --config wrangler.toml
