#!/usr/bin/env tsx
/**
 * Ensures a changeset file exists for the release.
 *
 * If no changeset files exist, creates one with the specified bump type
 * covering all packages in the fixed group.
 *
 * Used by the release workflow to auto-create changesets based on PR labels.
 *
 * Usage:
 *   tsx tools/release/ensure-changeset.ts --bump patch|minor|major
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "../..");
const CHANGESET_DIR = join(ROOT, ".changeset");
const PACKAGES_DIR = join(ROOT, "packages");

// ─── CLI Args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let bump: "patch" | "minor" | "major" = "patch";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--bump" && args[i + 1]) {
      const val = args[++i];
      if (val === "patch" || val === "minor" || val === "major") {
        bump = val;
      }
    }
  }

  return { bump };
}

// ─── Changeset Detection ────────────────────────────────────────────────────

function hasExistingChangesets(): boolean {
  if (!existsSync(CHANGESET_DIR)) return false;

  const files = readdirSync(CHANGESET_DIR);
  return files.some(
    (f) =>
      f.endsWith(".md") &&
      f !== "README.md" &&
      !f.startsWith(".")
  );
}

// ─── Package Discovery ──────────────────────────────────────────────────────

function getPublicPackageNames(): string[] {
  const dirs = readdirSync(PACKAGES_DIR);
  const names: string[] = [];

  for (const dir of dirs) {
    const pkgPath = join(PACKAGES_DIR, dir, "package.json");
    if (!existsSync(pkgPath)) continue;

    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    if (!pkg.private && pkg.name) {
      names.push(pkg.name);
    }
  }

  return names.sort();
}

// ─── Commit Summary ─────────────────────────────────────────────────────────

function getCommitSummary(): string {
  try {
    const lastTag = execSync("git describe --tags --abbrev=0 2>/dev/null", {
      encoding: "utf-8",
      cwd: ROOT,
    }).trim();
    const log = execSync(
      `git log ${lastTag}..HEAD --oneline --no-merges`,
      { encoding: "utf-8", cwd: ROOT }
    ).trim();
    return log || "Internal improvements";
  } catch {
    try {
      const log = execSync("git log -10 --oneline --no-merges", {
        encoding: "utf-8",
        cwd: ROOT,
      }).trim();
      return log || "Internal improvements";
    } catch {
      return "Internal improvements";
    }
  }
}

// ─── Changeset File Generation ──────────────────────────────────────────────

function generateChangesetId(): string {
  const adjectives = [
    "brave", "calm", "eager", "fair", "gentle", "happy", "keen",
    "lively", "neat", "polite", "quick", "sharp", "swift", "wise", "silly"
  ];
  const nouns = [
    "foxes", "hawks", "lions", "pandas", "ravens", "tides",
    "waves", "winds", "wolves", "zebras", "camels"
  ];
  const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(adjectives)}-${pick(nouns)}-${pick(adjectives)}`;
}

function createChangeset(
  bump: "patch" | "minor" | "major",
  packages: string[],
  summary: string
) {
  const id = generateChangesetId();
  const frontmatter = packages
    .map((name) => `"${name}": ${bump}`)
    .join("\n");

  // Truncate summary for changeset (keep it concise)
  const lines = summary.split("\n").slice(0, 10);
  const changesetSummary = lines.length < summary.split("\n").length
    ? lines.join("\n") + "\n..."
    : summary;

  const content = `---
${frontmatter}
---

Release v${bump} bump

${changesetSummary}
`;

  const filePath = join(CHANGESET_DIR, `${id}.md`);
  writeFileSync(filePath, content, "utf-8");
  return { id, filePath };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const { bump } = parseArgs();

  console.log(`🔍 Checking for existing changesets...`);

  if (hasExistingChangesets()) {
    console.log("✅ Changeset files already exist — skipping auto-creation");
    console.log(
      `   Tip: Remove existing changeset files to auto-generate with --bump ${bump}`
    );
    return;
  }

  console.log(`⚠️  No changeset files found — creating one with bump type: ${bump}`);

  const packages = getPublicPackageNames();
  console.log(`   Found ${packages.length} public packages`);

  const summary = getCommitSummary();
  const { id, filePath } = createChangeset(bump, packages, summary);

  console.log(`✅ Created changeset: ${id}`);
  console.log(`   File: ${filePath}`);
  console.log(`   Bump: ${bump}`);
  console.log(`   Packages: ${packages.length}`);
}

main();
