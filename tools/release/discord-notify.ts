#!/usr/bin/env tsx
/**
 * Discord webhook notification for @open-wa releases
 *
 * Posts a rich embed with release notes and release image to Discord.
 *
 * Usage:
 *   tsx tools/release/discord-notify.ts --version X.Y.Z [--notes RELEASE_BODY.md] [--image release.png]
 *
 * Env:
 *   DISCORD_WEBHOOK_URL — Discord webhook URL (required)
 */

import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "../..");

// ─── CLI Args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let version = "";
  let notesPath = join(ROOT, "RELEASE_BODY.md");
  let imagePath = join(ROOT, "release.png");
  let isTest = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--version" && args[i + 1]) version = args[++i];
    if (args[i] === "--notes" && args[i + 1]) notesPath = args[++i];
    if (args[i] === "--image" && args[i + 1]) imagePath = args[++i];
    if (args[i] === "--test") isTest = true;
  }

  if (!version) {
    const corePkg = JSON.parse(
      readFileSync(join(ROOT, "packages", "core", "package.json"), "utf-8")
    );
    version = corePkg.version;
  }

  return { version, notesPath, imagePath, isTest };
}

// ─── Parse Release Notes ────────────────────────────────────────────────────

function extractHighlights(notes: string): string {
  // Extract the highlights section or first meaningful content
  const highlightsMatch = notes.match(
    /## 🌟 Highlights\n([\s\S]*?)(?=\n## |$)/
  );
  if (highlightsMatch) return highlightsMatch[1].trim();

  // Fallback: extract first bullet-point section
  const lines = notes.split("\n").filter((l) => l.startsWith("- "));
  return lines.slice(0, 5).join("\n") || "Internal improvements and updates.";
}

function extractPackageCount(notes: string): number {
  const match = notes.match(/(\d+)\s*packages?\s*updated/i);
  return match ? parseInt(match[1]) : 0;
}

function extractCommitCount(notes: string): number {
  const match = notes.match(/(\d+)\s*commits?/i);
  return match ? parseInt(match[1]) : 0;
}

// ─── Discord Embed ──────────────────────────────────────────────────────────

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  url?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  image?: { url: string };
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
}

function buildEmbed(version: string, notes: string, isTest: boolean): DiscordEmbed {
  const highlights = extractHighlights(notes);
  const pkgCount = extractPackageCount(notes);
  const commitCount = extractCommitCount(notes);
  const isPreRelease = version.includes("-");
  const releaseUrl = `https://github.com/open-wa/wa-automate-nodejs/releases/tag/v${version}`;

  // Truncate highlights if too long for Discord (max 4096 for description)
  const maxDescLen = 2000;
  const description =
    highlights.length > maxDescLen
      ? highlights.slice(0, maxDescLen) + "\n\n_...see full release notes_"
      : highlights;

  return {
    title: isTest ? `🧪 [TEST DRY RUN] @open-wa v${version}` : `@open-wa v${version}`,
    description,
    color: isPreRelease ? 0xffb86c : 0x50fa7b, // Orange for pre-release, green for stable
    url: releaseUrl,
    fields: [
      ...(pkgCount
        ? [
            {
              name: "📦 Packages",
              value: `${pkgCount} updated`,
              inline: true,
            },
          ]
        : []),
      ...(commitCount
        ? [
            {
              name: "📋 Commits",
              value: `${commitCount}`,
              inline: true,
            },
          ]
        : []),
      {
        name: "🏷️ Tag",
        value: isPreRelease ? version.split("-")[1].split(".")[0] : "latest",
        inline: true,
      },
      {
        name: "📥 Install",
        value: `\`pnpm add @open-wa/wa-automate@${version}\``,
        inline: false,
      },
    ],
    image: { url: "attachment://release.png" },
    footer: {
      text: "open-wa/wa-automate-nodejs",
    },
    timestamp: new Date().toISOString(),
  };
}

// ─── Send to Discord ────────────────────────────────────────────────────────

async function sendWebhook(
  webhookUrl: string,
  version: string,
  notes: string,
  imagePath: string,
  isTest: boolean
) {
  const embed = buildEmbed(version, notes, isTest);

  const testPrefix = isTest ? "🧪 **[TEST DRY RUN]** " : "";
  const payload = {
    username: "Release Bot",
    content: `${testPrefix}🚀🚀 **NEW RELEASE** 🚀🚀\nPlease update to **v${version}**`,
    embeds: [embed],
  };

  // Send the rendered image and notes in the same confirmed message.
  console.log("📎 Attaching release image...");
  const imageBuffer = readFileSync(imagePath);
  const formData = new FormData();
  formData.append("payload_json", JSON.stringify(payload));
  formData.append(
    "files[0]",
    new Blob([imageBuffer], { type: "image/png" }),
    "release.png"
  );

  const confirmedUrl = new URL(webhookUrl);
  confirmedUrl.searchParams.set("wait", "true");
  const response = await fetch(confirmedUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Discord webhook failed: ${response.status} ${response.statusText}\n${text}`
    );
  }
  const message = (await response.json()) as { id?: string };
  if (!message.id) throw new Error("Discord did not confirm a posted message");
  console.log(`Discord message ID: ${message.id}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // --- Manually load .env variables if present ---
  const envPath = join(ROOT, ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        // Remove surrounding quotes and carriage returns
        process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  }

  const { version, notesPath, imagePath, isTest } = parseArgs();
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("DISCORD_WEBHOOK_URL is required for a release announcement");
  }

  console.log(`📢 Posting release notification for v${version} to Discord...`);

  // Read release notes
  if (!existsSync(notesPath)) throw new Error(`Release notes not found: ${notesPath}`);
  const notes = readFileSync(notesPath, "utf-8");

  // Check for release image
  if (!existsSync(imagePath)) throw new Error(`Release image not found: ${imagePath}`);

  await sendWebhook(webhookUrl, version, notes, imagePath, isTest);

  console.log("✅ Discord notification sent!");
}

main().catch((err) => {
  console.error("Failed to send Discord notification:", err);
  process.exit(1);
});
