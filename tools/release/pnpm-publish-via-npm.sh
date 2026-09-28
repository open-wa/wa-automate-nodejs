#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "publish" ]]; then
  exec "${REAL_PNPM}" "$@"
fi
shift

# Changesets chooses pnpm publish for pnpm workspaces. pnpm 11 publishes
# natively, while npm's trusted publisher exchange runs in npm publish.
# Pack with pnpm so workspace: ranges become registry versions, then upload
# the resulting tarball with the npm CLI and its GitHub OIDC credential.
publish_args=()
for arg in "$@"; do
  if [[ "${arg}" != "--no-git-checks" ]]; then
    publish_args+=("${arg}")
  fi
done

pack_dir="$(mktemp -d "${TMPDIR:-/tmp}/open-wa-package.XXXXXX")"
trap 'rm -rf "${pack_dir}"' EXIT
"${REAL_PNPM}" pack --pack-destination "${pack_dir}" >/dev/null

shopt -s nullglob
tarballs=("${pack_dir}"/*.tgz)
if [[ "${#tarballs[@]}" -ne 1 ]]; then
  printf 'Expected one package tarball, found %s in %s\n' "${#tarballs[@]}" "${pack_dir}" >&2
  exit 1
fi

npm publish "${tarballs[0]}" "${publish_args[@]}"
