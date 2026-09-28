#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

cd "${REPO_ROOT}"

temp_npmrc_files=()

cleanup() {
  for npmrc_file in "${temp_npmrc_files[@]:-}"; do
    if [[ -n "${npmrc_file}" && -f "${npmrc_file}" ]]; then
      rm -f "${npmrc_file}"
    fi
  done
}
trap cleanup EXIT

create_npmjs_npmrc() {
  npmjs_npmrc="$(mktemp "${TMPDIR:-/tmp}/open-wa-npmjs.XXXXXX.npmrc")"
  temp_npmrc_files+=("${npmjs_npmrc}")
  {
    printf '%s\n' 'registry=https://registry.npmjs.org/'
    printf '%s\n' '//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}'
  } > "${npmjs_npmrc}"
}

create_github_npmrc() {
  github_npmrc="$(mktemp "${TMPDIR:-/tmp}/open-wa-github.XXXXXX.npmrc")"
  temp_npmrc_files+=("${github_npmrc}")
  {
    printf '%s\n' '@open-wa:registry=https://npm.pkg.github.com'
    printf '%s\n' '//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}'
  } > "${github_npmrc}"
}

changeset_help_mentions_no_git_tag() {
  pnpm exec changeset publish --help 2>/dev/null | grep -q -- '--no-git-tag'
}

changeset_pre_mode_tag() {
  node -e "const fs=require('fs'); const p='.changeset/pre.json'; if (!fs.existsSync(p)) process.exit(1); const data=JSON.parse(fs.readFileSync(p,'utf8')); if (data.mode === 'pre' && data.tag) process.stdout.write(data.tag); else process.exit(1);" 2>/dev/null || true
}

run_changeset_publish() {
  local npmrc_file="$1"
  local token_value="$2"
  shift 2

  env \
    NPM_CONFIG_USERCONFIG="${npmrc_file}" \
    npm_config_userconfig="${npmrc_file}" \
    NODE_AUTH_TOKEN="${token_value}" \
    pnpm exec changeset "$@"
}

printf '%s\n' 'Building packages once before publishing...'
pnpm build

npm_publish_args=(publish)
pre_tag="$(changeset_pre_mode_tag)"
if [[ -n "${pre_tag}" ]]; then
  printf 'Changesets pre mode is active; publishing with its %s dist tag.\n' "${pre_tag}"
else
  printf '%s\n' 'Publishing stable versions with the latest dist tag.'
fi

if [[ -n "${NPM_TOKEN:-}" ]]; then
  create_npmjs_npmrc
  printf '%s\n' 'Publishing changed packages to npmjs...'
  run_changeset_publish "${npmjs_npmrc}" "${NPM_TOKEN}" "${npm_publish_args[@]}"
else
  printf '%s\n' 'Skipping npmjs publish: NPM_TOKEN is not set.'
fi

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  create_github_npmrc
  github_publish_args=("${npm_publish_args[@]}")

  if changeset_help_mentions_no_git_tag; then
    github_publish_args+=(--no-git-tag)
    printf '%s\n' 'Publishing changed packages to GitHub Packages without creating duplicate git tags...'
  else
    printf '%s\n' 'Publishing changed packages to GitHub Packages. This installed Changesets CLI does not advertise --no-git-tag, so duplicate git tag creation cannot be disabled.'
  fi

  run_changeset_publish "${github_npmrc}" "${GITHUB_TOKEN}" "${github_publish_args[@]}"
else
  printf '%s\n' 'Skipping GitHub Packages publish: GITHUB_TOKEN is not set.'
fi
