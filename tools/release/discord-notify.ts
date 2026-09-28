#!/usr/bin/env tsx
/**
 * Discord webhook notification for @open-wa releases
 *
 * Posts a cover and numbered changelog pages to Discord.
 *
 * Usage:
 *   tsx tools/release/discord-notify.ts --version X.Y.Z [--notes RELEASE_BODY.md]
 *     [--image release.png] [--edit-message DISCORD_MESSAGE_ID]
 *
 * Env:
 *   DISCORD_WEBHOOK_URL — Discord webhook URL (required)
 */

import { readFileSync, existsSync, readdirSync } from "fs";
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
  let editMessageId = "";
  let isTest = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--version" && args[i + 1]) version = args[++i];
    if (args[i] === "--notes" && args[i + 1]) notesPath = args[++i];
    if (args[i] === "--image" && args[i + 1]) imagePath = args[++i];
    if (args[i] === "--edit-message" && args[i + 1]) editMessageId = args[++i];
    if (args[i] === "--test") isTest = true;
  }

  if (!version) {
    const corePkg = JSON.parse(
      readFileSync(join(ROOT, "packages", "core", "package.json"), "utf-8")
    );
    version = corePkg.version;
  }

  return { version, notesPath, imagePath, editMessageId, isTest };
}

// ─── Parse Release Notes ────────────────────────────────────────────────────

function extractHighlights(notes: string): string {
  const intro = notes.match(/^# .+\n\n([\s\S]*?)\n## What changes for v4 users/m);
  const v5Section = notes.match(/## What changes for v4 users\n([\s\S]*?)(?=\n## |$)/);
  if (intro && v5Section) {
    const points = [...v5Section[1].matchAll(/^### \d+ \/ (.+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)]
      .slice(0, 3)
      .map(([, title, copy]) => `**${title}** — ${copy.trim()}`);
    return [intro[1].trim(), ...points].join("\n\n");
  }
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
  const match = notes.match(/(\d+)\s*package(?:s?\s*updated| changelogs?)/i);
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
    title: isTest ? `[TEST] OpenWA v${version}` : `OpenWA v${version}`,
    description,
    color: isPreRelease ? 0xa3b7f5 : 0x2d6bff,
    url: releaseUrl,
    fields: [
      ...(pkgCount
        ? [
            {
              name: "Packages",
              value: `${pkgCount} updated`,
              inline: true,
            },
          ]
        : []),
      ...(commitCount
        ? [
            {
              name: "Commits",
              value: `${commitCount}`,
              inline: true,
            },
          ]
        : []),
      {
        name: "Tag",
        value: isPreRelease ? version.split("-")[1].split(".")[0] : "latest",
        inline: true,
      },
      {
        name: "Install",
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

function releaseImages(imagePath: string): string[] {
  const folder = dirname(imagePath);
  const cover = resolve(imagePath);
  const pages = readdirSync(folder)
    .filter((name) => /^release-\d{2,}\.png$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
    .map((name) => join(folder, name));
  return [cover, ...pages];
}

async function sendWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>,
  images: string[],
  editMessageId = ""
) {
  const formData = new FormData();
  const attachments = images.map((image, index) => ({
    id: index,
    filename: image.split("/").pop()!,
    description: index === 0 && image.endsWith("release.png")
      ? "OpenWA release cover" : "OpenWA release notes page",
  }));
  formData.append("payload_json", JSON.stringify({ ...payload, attachments }));
  for (const [index, image] of images.entries()) {
    formData.append(`files[${index}]`, new Blob([readFileSync(image)], { type: "image/png" }), image.split("/").pop()!);
  }

  const confirmedUrl = new URL(webhookUrl);
  confirmedUrl.searchParams.set("wait", "true");
  if (editMessageId) {
    if (!/^\d{17,20}$/.test(editMessageId)) throw new Error("Invalid Discord message ID");
    confirmedUrl.pathname += `/messages/${editMessageId}`;
  }
  const response = await fetch(confirmedUrl, {
    method: editMessageId ? "PATCH" : "POST",
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

  const { version, notesPath, imagePath, editMessageId, isTest } = parseArgs();
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("DISCORD_WEBHOOK_URL is required for a release announcement");
  }

  console.log(`${editMessageId ? "Updating" : "Posting"} release v${version} on Discord...`);

  // Read release notes
  if (!existsSync(notesPath)) throw new Error(`Release notes not found: ${notesPath}`);
  const notes = readFileSync(notesPath, "utf-8");

  // Check for release image
  if (!existsSync(imagePath)) throw new Error(`Release image not found: ${imagePath}`);

  const images = releaseImages(imagePath);
  const cover = images[0];
  const intro = {
    username: "OpenWA",
    content: `${isTest ? "[TEST] " : ""}**OpenWA v${version}** · ${images.length} readable release pages`,
    embeds: [buildEmbed(version, notes, isTest)],
  };
  await sendWebhook(webhookUrl, intro, [cover], editMessageId);

  // Three sheets per message keep the long release browsable.
  for (let start = 1; start < images.length; start += 3) {
    const batch = images.slice(start, start + 3);
    const embeds = batch.map((file, index) => ({
      title: `Release notes · page ${String(start + index + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`,
      color: 0x2d6bff,
      image: { url: `attachment://${file.split("/").pop()}` },
    }));
    await sendWebhook(webhookUrl, {
      username: "OpenWA",
      content: `OpenWA v${version} · release notes`,
      embeds,
    }, batch);
  }

  console.log(`Discord release pages sent: ${images.length}`);
}

main().catch((err) => {
  console.error("Failed to send Discord notification:", err);
  process.exit(1);
});
