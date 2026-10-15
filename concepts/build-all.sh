#!/usr/bin/env bash
# Build concepts into concepts/_site/<slug>/ and write the gallery index.
#   bash concepts/build-all.sh [slug …]   build the given slugs (default: every NN-* folder)
#   bash concepts/build-all.sh --gallery  only rewrite the gallery from what's in _site
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
# pnpm 11 checks deps before `pnpm run` and can install a parent workspace from
# inside a concept folder; each concept manages its own install here.
export pnpm_config_verify_deps_before_run=false
site="$here/_site"

pm() { if command -v pnpm >/dev/null 2>&1; then pnpm "$@"; else npm "$@"; fi; }
# A concept with its own pnpm-workspace.yaml is its own pnpm root; older ones
# without it must not attach to a parent workspace.
install() {
  if ! command -v pnpm >/dev/null 2>&1; then npm install
  elif [[ -f pnpm-workspace.yaml ]]; then pnpm install
  else pnpm install --ignore-workspace
  fi
}

build() {
  rm -rf "$site" && mkdir -p "$site"
  local dirs=() slug dir
  if (( $# > 0 )); then for slug in "$@"; do dirs+=("$here/$slug/"); done; else dirs=("$here"/[0-9][0-9]-*/); fi
  for dir in "${dirs[@]}"; do
    slug="$(basename "$dir")"
    [[ -f "$dir/package.json" ]] || { echo "skip $slug (no package.json)"; continue; }
    echo "━━ $slug"
    # Reuse an existing install: pnpm's minimumReleaseAge policy rejects lockfiles
    # that pin same-day releases, so a fresh install can fail where the agent's didn't.
    if ! (cd "$dir" && { [[ -d node_modules ]] || install; } && pm run build); then
      echo "✗ $slug failed to build; leaving it out" >&2
      continue
    fi
    cp -R "$dir/dist" "$site/$slug"
  done
}

gallery() {
  mkdir -p "$site"
  local cards="" dir slug name tagline flow thumb
  for dir in "$site"/[0-9][0-9]-*/; do
    [[ -d "$dir" ]] || continue
    slug="$(basename "$dir")"
    name="$slug"; tagline=""; flow=""
    if [[ -f "$here/$slug/concept.json" ]]; then
      name="$(node -e 'const c=require(process.argv[1]);process.stdout.write(String(c.name||""))' "$here/$slug/concept.json")"
      tagline="$(node -e 'const c=require(process.argv[1]);process.stdout.write(String(c.tagline||""))' "$here/$slug/concept.json")"
      flow="$(node -e 'const c=require(process.argv[1]);const f=String(c.flow||"");process.stdout.write(f.startsWith("TODO")?"":f)' "$here/$slug/concept.json")"
    fi
    thumb=""
    if [[ -f "$here/_qa/$slug/thumb.jpg" ]]; then
      mkdir -p "$site/_thumbs" && cp "$here/_qa/$slug/thumb.jpg" "$site/_thumbs/$slug.jpg"
      thumb="<img src=\"/_thumbs/$slug.jpg\" alt=\"\" loading=\"lazy\" width=\"1440\" height=\"900\">"
    fi
    cards+="<a class=\"card\" href=\"/$slug/\">${thumb}<span class=\"n\">${slug%%-*}</span><strong>${name}</strong><span class=\"t\">${tagline}</span>${flow:+<span class=\"chip\">${flow}</span>}</a>"
  done
  # Optional gallery font: the first .woff2/.ttf in _shared/fonts (e.g. a licensed brand mono).
  local font fontface=""
  font="$(ls "$here"/_shared/fonts/*.woff2 "$here"/_shared/fonts/*.ttf 2>/dev/null | head -1 || true)"
  if [[ -n "$font" ]]; then
    mkdir -p "$site/_fonts" && cp "$font" "$site/_fonts/"
    fontface="@font-face{font-family:\"Gallery\";src:url(/_fonts/$(basename "$font"));font-display:swap}"
  fi
  cat > "$site/index.html" <<HTML
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${CONCEPTS_TITLE:-Landing concepts}</title><meta name="description" content="Landing-page concepts"><meta name="robots" content="noindex">
<style>
${fontface}
:root{--bg:#0b0d10;--fg:#e9edf2;--muted:#8a94a3;--line:#1f2630;--accent:#3d6bff}
@media (prefers-color-scheme:light){:root{--bg:#f6f7f9;--fg:#0b0d10;--muted:#5b6573;--line:#dde2e8}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 "Gallery",ui-monospace,monospace;padding:40px 16px}
main{max-width:1120px;margin:0 auto}h1{font-size:20px;margin:0 0 4px}p{color:var(--muted);margin:0 0 28px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.card{display:flex;flex-direction:column;gap:6px;padding:14px;border:1px solid var(--line);border-radius:10px;color:inherit;text-decoration:none;transition:border-color .2s,transform .2s}
.card:hover,.card:focus-visible{border-color:var(--accent);transform:translateY(-2px)}
.card img{width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;object-position:top;border-radius:6px;margin-bottom:6px;background:var(--line)}
.n{color:var(--accent)}.t{color:var(--muted);font-size:13px}
.chip{align-self:flex-start;font-size:12px;padding:2px 8px;border:1px solid var(--line);border-radius:99px;color:var(--muted)}
@media (prefers-reduced-motion:reduce){.card{transition:none}.card:hover{transform:none}}
</style></head><body><main><h1>${CONCEPTS_TITLE:-Landing concepts}</h1><p>Open each on desktop and phone.</p>
<div class="grid">${cards}</div></main></body></html>
HTML
  echo "Gallery lists $(ls -d "$site"/[0-9][0-9]-* 2>/dev/null | wc -l | tr -d ' ') concepts"
}

if [[ "${1:-}" == "--gallery" ]]; then gallery; exit 0; fi
build "$@"
gallery
