#!/usr/bin/env tsx
/**
 * AI-powered release notes generator for @open-wa v5
 *
 * Reads git history + per-package changelogs and produces polished release notes.
 * Uses Gemini (via GOOGLE_API_KEY) for AI summary, falls back to structured template.
 *
 * Usage:
 *   tsx tools/release/generate-notes.ts [--version X.Y.Z] [--output RELEASE_BODY.md]
 *
 * Env:
 *   GOOGLE_API_KEY  — Gemini API key (optional, enables AI summary)
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "../..");
const PACKAGES_DIR = join(ROOT, "packages");

// ─── CLI Args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let version = "";
  let compare = "";
  let output = join(ROOT, "RELEASE_BODY.md");

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--version" && args[i + 1]) version = args[++i];
    if (args[i] === "--output" && args[i + 1]) output = args[++i];
    if (args[i] === "--compare" && args[i + 1]) compare = args[++i];
  }

  if (!version) {
    // Read from core package.json
    const corePkg = JSON.parse(
      readFileSync(join(PACKAGES_DIR, "core", "package.json"), "utf-8")
    );
    version = corePkg.version;
  }

  return { version, output, compare };
}

// ─── Git History ─────────────────────────────────────────────────────────────

interface Commit {
  hash: string;
  shortHash: string;
  subject: string;
  body: string;
  type: string;
  scope: string;
  description: string;
}

function getLastTag(): string | null {
  try {
    return execSync("git describe --tags --abbrev=0 2>/dev/null", {
      encoding: "utf-8",
      cwd: ROOT,
    }).trim();
  } catch {
    return null;
  }
}

function getCommitsSince(ref: string | null): Commit[] {
  const range = ref ? `${ref}..HEAD` : "HEAD~50..HEAD";
  const SEP = "---COMMIT_SEP---";
  const FIELD = "---FIELD---";

  let raw: string;
  try {
    raw = execSync(
      `git log ${range} --format="${SEP}%H${FIELD}%h${FIELD}%s${FIELD}%b" --no-merges`,
      { encoding: "utf-8", cwd: ROOT, maxBuffer: 10 * 1024 * 1024 }
    );
  } catch {
    return [];
  }

  return raw
    .split(SEP)
    .filter(Boolean)
    .map((entry) => {
      const [hash, shortHash, subject, ...bodyParts] = entry.split(FIELD);
      const body = bodyParts.join(FIELD).trim();

      // Parse conventional commit
      const match = subject.match(
        /^(\w+)(?:\(([^)]*)\))?(!)?:\s*(.+)$/
      );

      return {
        hash: hash.trim(),
        shortHash: shortHash.trim(),
        subject: subject.trim(),
        body,
        type: match?.[1] || "other",
        scope: match?.[2] || "",
        description: match?.[4] || subject.trim(),
      };
    });
}

function groupCommits(commits: Commit[]) {
  const groups: Record<string, Commit[]> = {};
  const order = [
    "feat",
    "fix",
    "perf",
    "refactor",
    "docs",
    "test",
    "chore",
    "ci",
    "build",
    "other",
  ];

  for (const commit of commits) {
    const key = order.includes(commit.type) ? commit.type : "other";
    (groups[key] ??= []).push(commit);
  }

  return { groups, order: order.filter((k) => groups[k]?.length) };
}

const TYPE_LABELS: Record<string, string> = {
  feat: "✨ Features",
  fix: "🐛 Bug Fixes",
  perf: "⚡ Performance",
  refactor: "♻️ Refactors",
  docs: "📝 Documentation",
  test: "✅ Tests",
  chore: "🔧 Maintenance",
  ci: "👷 CI/CD",
  build: "📦 Build",
  other: "📋 Other",
};

// ─── Changelog Parsing ──────────────────────────────────────────────────────

interface PackageChanges {
  name: string;
  dir: string;
  body: string;
}

function parseChangelog(
  filePath: string,
  targetVersion: string
): string | null {
  if (!existsSync(filePath)) return null;

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  let capturing = false;
  const body: string[] = [];

  for (const line of lines) {
    const versionMatch = line.match(/^##\s+\[?(\d+\.\d+\.\d+[^\]\s]*)\]?/);

    if (versionMatch) {
      if (capturing) break;
      if (versionMatch[1] === targetVersion) capturing = true;
      continue;
    }

    if (capturing) body.push(line);
  }

  const trimmed = body.join("\n").trim();
  return trimmed || null;
}

function collectPackageChanges(version: string): PackageChanges[] {
  const dirs = readdirSync(PACKAGES_DIR).filter((dir) => {
    const pkgPath = join(PACKAGES_DIR, dir, "package.json");
    if (!existsSync(pkgPath)) return false;
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return !pkg.private;
  });

  const changes: PackageChanges[] = [];

  for (const dir of dirs) {
    const pkgPath = join(PACKAGES_DIR, dir, "package.json");
    const changelogPath = join(PACKAGES_DIR, dir, "CHANGELOG.md");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const body = parseChangelog(changelogPath, version);

    if (body) {
      changes.push({ name: pkg.name, dir, body });
    }
  }

  return changes;
}

// ─── Template Generator (no AI) ─────────────────────────────────────────────

function generateTemplate(
  version: string,
  commits: Commit[],
  packageChanges: PackageChanges[],
  grouped: ReturnType<typeof groupCommits>
): string {
  const lines: string[] = [];

  lines.push(`# @open-wa v${version}\n`);

  // Quick stats
  const featCount = grouped.groups["feat"]?.length || 0;
  const fixCount = grouped.groups["fix"]?.length || 0;
  lines.push(
    `> ${commits.length} commits · ${featCount} features · ${fixCount} fixes · ${packageChanges.length} packages updated\n`
  );

  // Package changes
  if (packageChanges.length > 0) {
    lines.push(`## 📦 Package Changes\n`);
    for (const pkg of packageChanges) {
      lines.push(`### ${pkg.name}\n`);
      lines.push(pkg.body);
      lines.push("");
    }
  }

  // Commit log grouped by type
  lines.push(`## 📋 Commit Log\n`);
  for (const type of grouped.order) {
    const commits = grouped.groups[type];
    if (!commits?.length) continue;

    lines.push(`### ${TYPE_LABELS[type] || type}\n`);
    for (const c of commits) {
      const scope = c.scope ? `**${c.scope}**: ` : "";
      lines.push(`- ${scope}${c.description} (\`${c.shortHash}\`)`);
    }
    lines.push("");
  }

  lines.push(`---`);
  lines.push(
    `Full changelog: https://github.com/open-wa/wa-automate-nodejs/compare/v${version}...HEAD`
  );

  return lines.join("\n");
}

// ─── Gemini AI Summary ──────────────────────────────────────────────────────

async function generateAISummary(
  version: string,
  commits: Commit[],
  packageChanges: PackageChanges[],
  templateNotes: string
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.log("ℹ️  No GOOGLE_API_KEY set — using template generator");
    return null;
  }

  console.log("🤖 Generating AI summary via Gemini...");

  const commitSummary = commits
    .slice(0, 60)
    .map((c) => `- [${c.type}${c.scope ? `(${c.scope})` : ""}] ${c.description}`)
    .join("\n");

  const changelogSummary = packageChanges
    .map((p) => `### ${p.name}\n${p.body}`)
    .join("\n\n");

  const prompt = `You are the release manager for @open-wa, a popular open-source WhatsApp automation library (GitHub: open-wa/wa-automate-nodejs).

Generate polished release notes for version ${version}. Be fun, heavily use emojis, and separate changes logically by concerns (e.g., 🛠️ Fixes, ✨ Features, 🏎️ Performance). Highlight what ultimately matters to users.

## Format

Return ONLY the markdown content (no wrapping code fences). Use this structure:

# @open-wa v${version}

> One-line executive summary of what's new (fun tone)

## 🌟 Highlights
(A fun, emoji-filled summary of the top changes separated by concerns. Use bolding and concise bullet points. No generic filler.)

## 📦 Package Changes
(Summarise per-package changes, skip packages with only internal/deps updates)

## 📋 Full Commit Log
(Group by type with emoji headers, include commit short hashes)

---
Full changelog link

## Raw Data

### Commits (${commits.length} total)
${commitSummary}

### Changelogs
${changelogSummary || "No changelog entries found for this version."}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Gemini returned empty response");
      return null;
    }

    // Strip code fences if the model wrapped them anyway
    return text.replace(/^```(?:markdown)?\n?/i, "").replace(/\n?```$/i, "").trim();
  } catch (err) {
    console.error("Gemini API call failed:", err);
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

// Optional .env loading since we might run outside of standard loading env
if (existsSync(join(ROOT, ".env"))) {
  const envContent = readFileSync(join(ROOT, ".env"), "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

async function main() {
  const { version, output, compare } = parseArgs();

  console.log(`📝 Generating release notes for v${version}...`);

  // Gather data
  const lastTag = compare || getLastTag();
  console.log(`   Last tag: ${lastTag || "(none)"}`);

  const commits = getCommitsSince(lastTag);
  console.log(`   Commits since last tag: ${commits.length}`);

  const packageChanges = collectPackageChanges(version);
  console.log(`   Packages with changelog entries: ${packageChanges.length}`);

  const { groups, order } = groupCommits(commits);
  const grouped = { groups, order };

  // Generate template notes first (used as fallback and for raw data)
  const templateNotes = generateTemplate(version, commits, packageChanges, grouped);

  // Try AI summary
  const aiNotes = await generateAISummary(version, commits, packageChanges, templateNotes);

  const finalNotes = aiNotes || templateNotes;

  // Write outputs
  writeFileSync(output, finalNotes, "utf-8");
  console.log(`✅ Release notes written to ${output}`);

  // Also write a detailed log version
  const detailedPath = join(ROOT, "release-notes-detailed.md");
  writeFileSync(detailedPath, templateNotes, "utf-8");
  console.log(`   Detailed log: ${detailedPath}`);
}

main().catch((err) => {
  console.error("Failed to generate release notes:", err);
  process.exit(1);
});
