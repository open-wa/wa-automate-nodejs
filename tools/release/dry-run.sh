#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# @open-wa Release Dry Run
#
# Tests the full release pipeline locally using a Verdaccio registry.
# Builds, publishes, generates notes + image, and verifies installs.
#
# Usage:
#   ./tools/release/dry-run.sh [OPTIONS]
#
# Options:
#   --skip-build       Skip the turbo build step (use existing dist/)
#   --skip-image       Skip release image generation (requires puppeteer)
#   --skip-install     Skip test-install verification
#   --keep-verdaccio   Don't kill Verdaccio on exit (for manual inspection)
#   --port PORT        Verdaccio port (default: 4873)
#   --bump TYPE        Version bump type: patch|minor|major (default: patch)
#   --compare TAG      Compare against this tag for changelog (default: last tag)
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VERDACCIO_CONFIG="$SCRIPT_DIR/verdaccio-config.yaml"

# Defaults
SKIP_BUILD=false
SKIP_IMAGE=false
SKIP_INSTALL=false
KEEP_VERDACCIO=false
PORT=4873
BUMP="patch"
COMPARE=""
VERDACCIO_PID=""
NPMRC_BACKED_UP=false
TEST_DIR=""
VERSIONS_BUMPED=false

# ─── Colors ───────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

step() { echo -e "\n${CYAN}${BOLD}[$1/$TOTAL_STEPS]${NC} $2"; }
ok()   { echo -e "    ${GREEN}✓${NC} $1"; }
warn() { echo -e "    ${YELLOW}⚠${NC} $1"; }
fail() { echo -e "    ${RED}✗${NC} $1"; }

# ─── Parse Args ───────────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-build)     SKIP_BUILD=true; shift ;;
    --skip-image)     SKIP_IMAGE=true; shift ;;
    --skip-install)   SKIP_INSTALL=true; shift ;;
    --keep-verdaccio) KEEP_VERDACCIO=true; shift ;;
    --port)           PORT="$2"; shift 2 ;;
    --bump)           BUMP="$2"; shift 2 ;;
    --compare)        COMPARE="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

REGISTRY="http://localhost:$PORT"

# Calculate total steps
TOTAL_STEPS=9
$SKIP_BUILD && TOTAL_STEPS=$((TOTAL_STEPS - 1))
$SKIP_IMAGE && TOTAL_STEPS=$((TOTAL_STEPS - 1))
$SKIP_INSTALL && TOTAL_STEPS=$((TOTAL_STEPS - 1))

# ─── Cleanup ──────────────────────────────────────────────────────────────────

cleanup() {
  echo -e "\n${CYAN}Cleaning up...${NC}"

  # Restore .npmrc
  if $NPMRC_BACKED_UP && [[ -f "$ROOT/.npmrc.dryrun-backup" ]]; then
    cp "$ROOT/.npmrc.dryrun-backup" "$ROOT/.npmrc"
    rm -f "$ROOT/.npmrc.dryrun-backup"
    ok "Restored .npmrc"
  fi

  # Kill Verdaccio
  if [[ -n "$VERDACCIO_PID" ]] && ! $KEEP_VERDACCIO; then
    kill "$VERDACCIO_PID" 2>/dev/null || true
    wait "$VERDACCIO_PID" 2>/dev/null || true
    ok "Stopped Verdaccio (PID $VERDACCIO_PID)"
  elif [[ -n "$VERDACCIO_PID" ]] && $KEEP_VERDACCIO; then
    warn "Verdaccio still running at $REGISTRY (PID $VERDACCIO_PID)"
    warn "Kill it manually: kill $VERDACCIO_PID"
  fi

  # Revert version bumps in package.json files
  if $VERSIONS_BUMPED; then
    cd "$ROOT"
    git checkout -- 'packages/*/package.json' 'apps/*/package.json' 'package.json' '.changeset/' 'CHANGELOG.md' 2>/dev/null || true
    # Also revert any per-package CHANGELOG.md files
    git checkout -- 'packages/*/CHANGELOG.md' 2>/dev/null || true
    rm -f "$ROOT/.changeset/dry-run-changeset.md"
    ok "Reverted version bumps (codebase unchanged)"
  fi

  # Clean temp dir
  if [[ -n "$TEST_DIR" ]] && [[ -d "$TEST_DIR" ]]; then
    rm -rf "$TEST_DIR"
  fi

  # Clean verdaccio storage (only if we're stopping it)
  if ! $KEEP_VERDACCIO; then
    rm -rf /tmp/verdaccio-dry-run
  fi
}

trap cleanup EXIT

# ─── Header ───────────────────────────────────────────────────────────────────

echo -e "${BOLD}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           @open-wa  Release Dry Run                      ║"
echo "║           Testing the full release pipeline locally       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  Registry:  ${CYAN}$REGISTRY${NC}"
echo -e "  Bump type: ${CYAN}$BUMP${NC}"
echo -e "  Options:   build=$( ! $SKIP_BUILD && echo "yes" || echo "skip") image=$( ! $SKIP_IMAGE && echo "yes" || echo "skip") install=$( ! $SKIP_INSTALL && echo "yes" || echo "skip")"
echo ""

cd "$ROOT"
CURRENT_STEP=0

# ─── Step: Prerequisites ─────────────────────────────────────────────────────

CURRENT_STEP=$((CURRENT_STEP + 1))
step $CURRENT_STEP "Checking prerequisites..."

command -v node >/dev/null 2>&1 || { fail "node not found"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { fail "pnpm not found"; exit 1; }


NODE_VERSION=$(node -v)
PNPM_VERSION=$(pnpm -v)
ok "node $NODE_VERSION, pnpm v$PNPM_VERSION"

# Check if port is already in use
if lsof -i :"$PORT" >/dev/null 2>&1; then
  fail "Port $PORT is already in use. Kill the process or use --port"
  exit 1
fi
ok "Port $PORT is available"

# ─── Step: Start Verdaccio ────────────────────────────────────────────────────

CURRENT_STEP=$((CURRENT_STEP + 1))
step $CURRENT_STEP "Starting Verdaccio..."

# Clean previous storage
rm -rf /tmp/verdaccio-dry-run
mkdir -p /tmp/verdaccio-dry-run

# Start Verdaccio in background
pnpm dlx verdaccio --config "$VERDACCIO_CONFIG" --listen "$PORT" &
VERDACCIO_PID=$!

# Wait for Verdaccio to be ready
MAX_WAIT=30
for i in $(seq 1 $MAX_WAIT); do
  if curl -sS "$REGISTRY" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$VERDACCIO_PID" 2>/dev/null; then
    fail "Verdaccio process died unexpectedly"
    exit 1
  fi
  sleep 1
done

if ! curl -sS "$REGISTRY" >/dev/null 2>&1; then
  fail "Verdaccio failed to start within ${MAX_WAIT}s"
  exit 1
fi

ok "Verdaccio running at $REGISTRY (PID $VERDACCIO_PID)"
ok "Web UI: $REGISTRY"

# Register a test user and get token
REGISTER_RESPONSE=$(curl -sS -X PUT "$REGISTRY/-/user/org.couchdb.user:dryrun" \
  -H "Content-Type: application/json" \
  -d '{"name":"dryrun","password":"dryrun123","email":"dry@run.com"}' 2>/dev/null || echo '{}')

TOKEN=$(echo "$REGISTER_RESPONSE" | node -e "
  let d=''; process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{try{console.log(JSON.parse(d).token||'')}catch{console.log('')}})
")

if [[ -z "$TOKEN" ]]; then
  warn "Could not get auth token — publishing may fail"
else
  ok "Registered test user, got auth token"
fi

# Back up .npmrc and inject Verdaccio config
cp "$ROOT/.npmrc" "$ROOT/.npmrc.dryrun-backup"
NPMRC_BACKED_UP=true

# Append Verdaccio auth (don't override existing npmrc content)
if [[ -n "$TOKEN" ]]; then
  echo "" >> "$ROOT/.npmrc"
  echo "//localhost:$PORT/:_authToken=$TOKEN" >> "$ROOT/.npmrc"
fi

# ─── Step: Build ──────────────────────────────────────────────────────────────

if ! $SKIP_BUILD; then
  CURRENT_STEP=$((CURRENT_STEP + 1))
  step $CURRENT_STEP "Building all packages..."

  if pnpm turbo build --filter='!@open-wa/legacy' --filter='!@open-wa/legacy-documented' --filter='!@open-wa/orchestrator' 2>&1 | tail -5; then
    BUILT_COUNT=$(find packages -name "dist" -type d | wc -l | tr -d ' ')
    ok "Build complete ($BUILT_COUNT packages with dist/)"
  else
    fail "Build failed"
    exit 1
  fi
fi

# ─── Step: Version Bump (temporary) ──────────────────────────────────────────

CURRENT_STEP=$((CURRENT_STEP + 1))
step $CURRENT_STEP "Applying $BUMP version bump via changesets (temporary)..."

# Get the list of public packages for the changeset
PUBLIC_PKGS=$(pnpm ls -r --depth -1 --json | node -e "
  let d=''; process.stdin.on('data', c=>d+=c);
  process.stdin.on('end', () => {
    try {
      console.log(JSON.parse(d).filter(p=>!p.private && p.name !== 'wa-automate-nodejs').map(p=>p.name).join(','));
    } catch(e) {}
  })
")

# Create a temporary changeset file
CHANGESET_FILE="$ROOT/.changeset/dry-run-changeset.md"
echo '---' > "$CHANGESET_FILE"
IFS=',' read -ra PKG_ARRAY <<< "$PUBLIC_PKGS"
for pkg in "${PKG_ARRAY[@]}"; do
  echo "\"$pkg\": $BUMP" >> "$CHANGESET_FILE"
done
echo '---' >> "$CHANGESET_FILE"
echo '' >> "$CHANGESET_FILE"
echo "Dry run $BUMP bump" >> "$CHANGESET_FILE"

ok "Created temp changeset for ${#PKG_ARRAY[@]} packages ($BUMP)"

# Run changeset version to apply the bumps
if pnpm exec changeset version 2>&1 | tail -3; then
  VERSIONS_BUMPED=true
  # Show the new version
  NEW_VERSION=$(node -e "console.log(require('./packages/core/package.json').version)" 2>/dev/null || echo "unknown")
  ok "Versions bumped to $NEW_VERSION"
else
  warn "Changeset version failed — publishing with current versions"
fi

# ─── Step: Publish to Verdaccio ───────────────────────────────────────────────

CURRENT_STEP=$((CURRENT_STEP + 1))
step $CURRENT_STEP "Publishing to Verdaccio..."

PUBLISHED=0
FAILED=0
SKIPPED=0

PKG_DIRS=$(pnpm ls -r --depth -1 --json | node -e "
  let d=''; process.stdin.on('data', c=>d+=c);
  process.stdin.on('end', () => {
    try {
      console.log(JSON.parse(d).filter(p=>!p.private && p.name !== 'wa-automate-nodejs').map(p=>p.path).join('\n'));
    } catch(e) {}
  })
")

while read -r pkg_dir; do
  [[ -z "$pkg_dir" ]] || [[ ! -d "$pkg_dir" ]] && continue
  pkg_json="$pkg_dir/package.json"
  [[ -f "$pkg_json" ]] || continue

  PKG_NAME=$(node -e "console.log(require('$pkg_json').name)")

  # Check if dist exists
  if [[ ! -d "$pkg_dir/dist" ]] && [[ ! -f "$pkg_dir/dist/index.js" ]] && [[ ! -f "$pkg_dir/dist/index.cjs" ]]; then
    warn "$PKG_NAME — no dist/ found, skipping"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Publish from root so pnpm can resolve catalog: and workspace:* protocols
  if pnpm publish --filter "$PKG_NAME" --registry "$REGISTRY" --no-git-checks --access public 2>&1 | tail -1; then
    PUBLISHED=$((PUBLISHED + 1))
  else
    warn "$PKG_NAME — publish failed (non-fatal)"
    FAILED=$((FAILED + 1))
  fi
done <<< "$PKG_DIRS"

ok "Published: $PUBLISHED | Failed: $FAILED | Skipped: $SKIPPED"

# ─── Step: Generate Release Notes ────────────────────────────────────────────

CURRENT_STEP=$((CURRENT_STEP + 1))
step $CURRENT_STEP "Generating release notes..."

GENERATE_CMD=(pnpm exec tsx "$SCRIPT_DIR/generate-notes.ts")
if [[ -n "$COMPARE" ]]; then
  GENERATE_CMD+=(--compare "$COMPARE")
fi

if "${GENERATE_CMD[@]}" 2>&1; then
  if [[ -f "$ROOT/RELEASE_BODY.md" ]]; then
    NOTE_LINES=$(wc -l < "$ROOT/RELEASE_BODY.md" | tr -d ' ')
    ok "RELEASE_BODY.md ($NOTE_LINES lines)"
  fi
else
  warn "Release notes generation failed (non-fatal)"
fi

# ─── Step: Generate Release Image ────────────────────────────────────────────

if ! $SKIP_IMAGE; then
  CURRENT_STEP=$((CURRENT_STEP + 1))
  step $CURRENT_STEP "Generating release image..."

  if node "$ROOT/tools/release-image.js" 2>&1; then
    if [[ -f "$ROOT/release.png" ]]; then
      IMAGE_SIZE=$(du -h "$ROOT/release.png" | cut -f1)
      ok "release.png ($IMAGE_SIZE)"
    fi
  else
    warn "Release image generation failed (non-fatal, needs puppeteer)"
  fi
fi

# ─── Step: Test Install ──────────────────────────────────────────────────────

if ! $SKIP_INSTALL; then
  CURRENT_STEP=$((CURRENT_STEP + 1))
  step $CURRENT_STEP "Verifying install from Verdaccio..."

  TEST_DIR=$(mktemp -d)
  cd "$TEST_DIR"
  pnpm init >/dev/null 2>&1

  VERSION=$(node -e "console.log(require('$ROOT/packages/core/package.json').version)")

  if pnpm add "@open-wa/wa-automate@$VERSION" --registry "$REGISTRY" --silent 2>&1; then
    # Verify the package exists in node_modules
    if [[ -d "node_modules/@open-wa/wa-automate" ]]; then
      ok "@open-wa/wa-automate@$VERSION installed successfully"

      # Check if inter-deps resolved
      RESOLVED=$(ls node_modules/@open-wa/ 2>/dev/null | wc -l | tr -d ' ')
      ok "$RESOLVED @open-wa/* packages resolved"
    else
      warn "Package directory not found after install"
    fi
  else
    warn "Test install failed — check package exports and dependencies"
  fi

  cd "$ROOT"
fi

# ─── Step: Discord Notification ──────────────────────────────────────────────

CURRENT_STEP=$((CURRENT_STEP + 1))
step $CURRENT_STEP "Sending Discord notification (as test)..."

if pnpm exec tsx "$SCRIPT_DIR/discord-notify.ts" --test 2>&1; then
  ok "Discord test notification completed"
else
  warn "Discord notification failed (non-fatal)"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Dry Run Summary${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  📦 Packages published:  ${GREEN}$PUBLISHED${NC}"
echo -e "  ⚠️  Skipped/Failed:     $SKIPPED / $FAILED"
echo ""

# ─── Show Release Notes ──────────────────────────────────────────────────────

if [[ -f "$ROOT/RELEASE_BODY.md" ]]; then
  echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  📝 Release Notes (RELEASE_BODY.md)${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  cat "$ROOT/RELEASE_BODY.md"
  echo ""
fi

# ─── Show Detailed Notes Preview ─────────────────────────────────────────────

if [[ -f "$ROOT/release-notes-detailed.md" ]]; then
  echo -e "${BOLD}───────────────────────────────────────────────────────────${NC}"
  echo -e "${BOLD}  📋 Detailed Commit Log (release-notes-detailed.md)${NC}"
  echo -e "${BOLD}───────────────────────────────────────────────────────────${NC}"
  echo ""
  # Show first 60 lines to avoid flooding the terminal
  head -60 "$ROOT/release-notes-detailed.md"
  TOTAL_LINES=$(wc -l < "$ROOT/release-notes-detailed.md" | tr -d ' ')
  if [[ "$TOTAL_LINES" -gt 60 ]]; then
    echo ""
    echo -e "  ${YELLOW}... ($((TOTAL_LINES - 60)) more lines — see full file: ./release-notes-detailed.md)${NC}"
  fi
  echo ""
fi

# ─── Show Changeset ──────────────────────────────────────────────────────────

CHANGESET_FILES=$(find "$ROOT/.changeset" -name "*.md" ! -name "README.md" 2>/dev/null)
if [[ -n "$CHANGESET_FILES" ]]; then
  echo -e "${BOLD}───────────────────────────────────────────────────────────${NC}"
  echo -e "${BOLD}  📄 Changeset Files${NC}"
  echo -e "${BOLD}───────────────────────────────────────────────────────────${NC}"
  echo ""
  for cs_file in $CHANGESET_FILES; do
    echo -e "  ${CYAN}$(basename "$cs_file")${NC}"
    # Indent each line of the changeset
    sed 's/^/    /' "$cs_file"
    echo ""
  done
fi

# ─── Open Release Image ─────────────────────────────────────────────────────

if [[ -f "$ROOT/release.png" ]]; then
  IMAGE_SIZE=$(du -h "$ROOT/release.png" | cut -f1)
  echo -e "${BOLD}───────────────────────────────────────────────────────────${NC}"
  echo -e "${BOLD}  🖼️  Release Image${NC}"
  echo -e "${BOLD}───────────────────────────────────────────────────────────${NC}"
  echo ""
  echo -e "  File: ${GREEN}./release.png${NC} ($IMAGE_SIZE)"
  echo -e "  Opening in Preview..."
  open "$ROOT/release.png" 2>/dev/null || true
  echo ""
fi

# ─── Verdaccio Status ────────────────────────────────────────────────────────

echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"

if $KEEP_VERDACCIO; then
  echo -e "  🌐 Verdaccio UI:        ${CYAN}$REGISTRY${NC}"
  echo -e "  🔑 PID:                 $VERDACCIO_PID"
  echo ""
  echo -e "  ${YELLOW}Verdaccio is still running. Browse packages at the URL above.${NC}"
  echo -e "  ${YELLOW}Kill manually with: kill $VERDACCIO_PID${NC}"
  KEEP_VERDACCIO=true
fi

echo ""

if [[ $FAILED -eq 0 ]] && [[ $PUBLISHED -gt 0 ]]; then
  echo -e "  ${GREEN}${BOLD}✅ Dry run PASSED — pipeline is ready for pnpm publish!${NC}"
else
  echo -e "  ${YELLOW}${BOLD}⚠️  Dry run completed with warnings — review output above${NC}"
fi

echo ""
