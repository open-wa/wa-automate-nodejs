#!/usr/bin/env bash
# Build every committed concept into concepts/_site/<slug>/ and generate the gallery.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(git -C "$HERE" rev-parse --show-toplevel)"
SITE="$HERE/_site"

rm -rf "$SITE"
mkdir -p "$SITE"

built=()
failed=()

for dir in "$HERE"/*/; do
  slug="$(basename "$dir")"
  case "$slug" in _*|tools) continue ;; esac
  [ -f "$dir/concept.json" ] || continue
  if ! git -C "$REPO" ls-files --error-unmatch "concepts/$slug/concept.json" >/dev/null 2>&1; then
    echo "skip  $slug (concept.json not committed)"
    continue
  fi

  echo "build $slug"
  (
    cd "$dir"
    # Reuse the agent's node_modules: a fresh install can fail on a same-day pin.
    if [ ! -d node_modules ]; then
      pnpm install --ignore-workspace --frozen-lockfile
    fi
    rm -rf dist
    pnpm run build
  ) && {
    if [ ! -f "$dir/dist/index.html" ]; then
      echo "fail  $slug (no dist/index.html)"; failed+=("$slug"); continue
    fi
    mkdir -p "$SITE/$slug"
    cp -R "$dir/dist/." "$SITE/$slug/"
    cp "$dir/concept.json" "$SITE/$slug/concept.json"
    built+=("$slug")
  } || { echo "fail  $slug (build error)"; failed+=("$slug"); }
done

if [ ${#built[@]} -eq 0 ]; then
  echo "No concept built. Refusing to produce an empty site." >&2
  exit 1
fi

node "$HERE/tools/gallery.mjs" "$SITE" "${built[@]}"

echo
echo "built:  ${built[*]}"
[ ${#failed[@]} -eq 0 ] || echo "failed: ${failed[*]}"
