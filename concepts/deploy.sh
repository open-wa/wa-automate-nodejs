#!/usr/bin/env bash
# Build the given concepts (default: every concept committed to git) and publish
# them as one static-assets Worker. Refuses to publish an empty site.
#   bash concepts/deploy.sh [slug …]
#   bash concepts/deploy.sh --no-build    deploy what's already in _site
# Uses CLOUDFLARE_ACCOUNT_ID from the environment or account_id in wrangler.toml;
# WRANGLER overrides the wrangler command (default: npx --yes wrangler@4).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
if [[ "${1:-}" == "--no-build" ]]; then
  bash "$here/build-all.sh" --gallery
else
  slugs=("$@")
  if (( ${#slugs[@]} == 0 )); then
    while IFS= read -r slug; do slugs+=("$slug"); done < <(
      cd "$here" && git ls-files '[0-9][0-9]-*/package.json' | cut -d/ -f1 | sort -u
    )
  fi
  (( ${#slugs[@]} > 0 )) || { echo "✗ no committed concepts found; not deploying" >&2; exit 1; }
  bash "$here/build-all.sh" "${slugs[@]}"
fi
built=$(find "$here/_site" -mindepth 1 -maxdepth 1 -type d -name '[0-9][0-9]-*' | wc -l | tr -d ' ')
(( built > 0 )) || { echo "✗ no concepts built; not deploying" >&2; exit 1; }
cd "$here"
[[ -f worker.js ]] || { echo "✗ worker.js (the password gate) is missing; not deploying an open gallery" >&2; exit 1; }
${WRANGLER:-npx --yes wrangler@4} deploy
echo "Deployed $built concepts behind the shared password (any username, password: concepts)"
