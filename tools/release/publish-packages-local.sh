#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

cd "${REPO_ROOT}"

NPM_REGISTRY="https://registry.npmjs.org/"
NPM_SCOPE="@open-wa"
local_npmrc=""
local_token=""

cleanup() {
  if [[ -n "${local_npmrc}" && -f "${local_npmrc}" ]]; then
    rm -f "${local_npmrc}"
  fi
}
trap cleanup EXIT

create_npmjs_npmrc() {
  local_npmrc="$(mktemp "${TMPDIR:-/tmp}/open-wa-local-npmjs.XXXXXX.npmrc")"
  printf '%s\n' "registry=${NPM_REGISTRY}" > "${local_npmrc}"
}

changeset_pre_mode_tag() {
  node -e "const fs=require('fs'); const p='.changeset/pre.json'; if (!fs.existsSync(p)) process.exit(1); const data=JSON.parse(fs.readFileSync(p,'utf8')); if (data.mode === 'pre' && data.tag) process.stdout.write(data.tag); else process.exit(1);" 2>/dev/null || true
}

set_publish_args_for_current_pre_mode() {
  local pre_tag
  pre_tag="$(changeset_pre_mode_tag)"

  if [[ "${pre_tag}" == "alpha" ]]; then
    npm_publish_args=(publish)
    return
  fi

  npm_publish_args=(publish --tag alpha)
}

confirm_publish() {
  printf '%s\n' 'This will build packages and publish changed packages to npmjs only.'
  printf '%s\n' 'It will not publish to GitHub Packages and it will not store credentials in the repo.'
  printf '%s' 'Type "publish" to continue: '
  local confirmation
  IFS= read -r confirmation

  if [[ "${confirmation}" != "publish" ]]; then
    printf '%s\n' 'Cancelled.'
    exit 1
  fi
}

write_token_auth() {
  local_token="$1"
  printf '%s\n' '//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}' >> "${local_npmrc}"
}

prompt_for_auth() {
  if [[ -n "${NPM_TOKEN:-}" ]]; then
    write_token_auth "${NPM_TOKEN}"
    return
  fi

  if [[ ! -t 0 ]]; then
    printf '%s\n' 'NPM_TOKEN is not set and this shell is not interactive, so npm login cannot run.' >&2
    exit 1
  fi

  printf '%s\n' 'NPM_TOKEN is not set.'
  printf '%s' 'Paste an npm access token with publish rights for @open-wa (input hidden), or press Enter to run npm login: '
  local typed_token
  IFS= read -r -s typed_token
  printf '\n'

  if [[ -n "${typed_token}" ]]; then
    write_token_auth "${typed_token}"
    return
  fi

  printf '%s\n' 'Starting npm login against npmjs with a temporary npm config...'
  npm login \
    --registry="${NPM_REGISTRY}" \
    --scope="${NPM_SCOPE}" \
    --userconfig="${local_npmrc}"
}

verify_npm_auth() {
  printf '%s\n' 'Checking npm authentication...'

  if [[ -n "${local_token}" ]]; then
    env \
      NPM_CONFIG_USERCONFIG="${local_npmrc}" \
      npm_config_userconfig="${local_npmrc}" \
      NODE_AUTH_TOKEN="${local_token}" \
      npm whoami --registry="${NPM_REGISTRY}" >/dev/null
    return
  fi

  env \
    NPM_CONFIG_USERCONFIG="${local_npmrc}" \
    npm_config_userconfig="${local_npmrc}" \
    npm whoami --registry="${NPM_REGISTRY}" >/dev/null
}

run_changeset_publish() {
  if [[ -n "${local_token}" ]]; then
    env \
      NPM_CONFIG_USERCONFIG="${local_npmrc}" \
      npm_config_userconfig="${local_npmrc}" \
      NODE_AUTH_TOKEN="${local_token}" \
      pnpm exec changeset "$@"
    return
  fi

  env \
    NPM_CONFIG_USERCONFIG="${local_npmrc}" \
    npm_config_userconfig="${local_npmrc}" \
    pnpm exec changeset "$@"
}

confirm_publish
create_npmjs_npmrc
prompt_for_auth
verify_npm_auth

printf '%s\n' 'Building packages once before publishing...'
pnpm build

npm_publish_args=()
set_publish_args_for_current_pre_mode
if [[ "${#npm_publish_args[@]}" -eq 1 ]]; then
  printf '%s\n' 'Changesets pre mode is already set to alpha; publishing without --tag alpha because this installed CLI rejects explicit --tag in pre mode.'
fi

printf '%s\n' 'Publishing changed packages to npmjs with the alpha dist tag...'
run_changeset_publish "${npm_publish_args[@]}"
