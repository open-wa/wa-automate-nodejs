#!/usr/bin/env bash
set -euo pipefail

: "${BUMPY_PACKAGES:?Bumpy publish plan is required}"
: "${GITHUB_TOKEN:?GitHub token is required}"

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/open-wa-github-packages.XXXXXX")"
trap 'rm -rf "$temp_dir"' EXIT
printf '%s\n' '@open-wa:registry=https://npm.pkg.github.com' > "$temp_dir/npmrc"
printf '%s\n' '//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}' >> "$temp_dir/npmrc"
chmod 600 "$temp_dir/npmrc"

node - <<'NODE' > "$temp_dir/packages"
const fs = require('fs');
const names = new Set(JSON.parse(process.env.BUMPY_PACKAGES));
const reconcileAll = names.size === 0;
for (const root of ['packages', 'integrations', 'sdks', 'apps']) {
  if (!fs.existsSync(root)) continue;
  for (const entry of fs.readdirSync(root)) {
    const dir = `${root}/${entry}`;
    const manifest = `${dir}/package.json`;
    if (!fs.existsSync(manifest)) continue;
    const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (pkg.private) {
      if (names.has(pkg.name)) throw new Error(`Refusing to publish private package ${pkg.name}`);
      continue;
    }
    if (reconcileAll || names.has(pkg.name)) {
      names.delete(pkg.name);
      console.log(dir);
    }
  }
}
if (names.size > 0) {
  console.error(`Bumpy planned unknown packages: ${[...names].join(', ')}`);
  process.exitCode = 1;
}
NODE

shopt -s nullglob

while IFS= read -r package_dir; do
  package_name="$(node -p 'require(process.argv[1]).name' "$repo_root/$package_dir/package.json")"
  package_version="$(node -p 'require(process.argv[1]).version' "$repo_root/$package_dir/package.json")"

  if NODE_AUTH_TOKEN="$GITHUB_TOKEN" NPM_CONFIG_USERCONFIG="$temp_dir/npmrc" \
      npm view "$package_name@$package_version" version \
      --registry=https://npm.pkg.github.com >/dev/null 2>&1; then
    printf 'GitHub Packages already has %s@%s\n' "$package_name" "$package_version"
    continue
  fi

  package_pack_dir="$temp_dir/$(basename "$package_dir")"
  mkdir -p "$package_pack_dir"
  pnpm -r --filter "$package_name..." run build
  (cd "$package_dir" && pnpm pack --pack-destination "$package_pack_dir" >/dev/null)
  tarballs=("$package_pack_dir"/*.tgz)
  if [[ "${#tarballs[@]}" -ne 1 ]]; then
    printf 'Expected one tarball for %s\n' "$package_name" >&2
    exit 1
  fi

  NODE_AUTH_TOKEN="$GITHUB_TOKEN" NPM_CONFIG_USERCONFIG="$temp_dir/npmrc" \
    npm publish "${tarballs[0]}" --registry=https://npm.pkg.github.com \
    --access public --tag latest
done < "$temp_dir/packages"
