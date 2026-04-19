"use strict";
/**
 * Grouped Release Image Generator
 * 
 * Generates a single release image showing changes across ALL @open-wa/* packages.
 * Reads each package's CHANGELOG.md, extracts the latest version's changes,
 * and renders a grouped Dracula-themed screenshot.
 * 
 * Usage: node tools/release-image.js [--version X.Y.Z]
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const emoji = require("node-emoji");

const PACKAGES_DIR = path.join(__dirname, "..", "packages");
const ROOT = path.join(__dirname, "..");

/**
 * Parse a CHANGELOG.md file and extract the body for a given version.
 * Simple parser — looks for ## headings with version numbers.
 */
function parseChangelog(filePath, targetVersion) {
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  let capturing = false;
  let body = [];

  for (const line of lines) {
    // Match ## [version] or ## version headings
    const versionMatch = line.match(/^##\s+\[?(\d+\.\d+\.\d+[^\]\s]*)\]?/);

    if (versionMatch) {
      if (capturing) break; // Hit the next version, stop
      if (!targetVersion || versionMatch[1] === targetVersion) {
        capturing = true;
      }
      continue;
    }

    if (capturing) {
      body.push(line);
    }
  }

  const trimmed = body.join("\n").trim();
  return trimmed || null;
}

/**
 * Get the target version from CLI args or root package.json
 */
function getTargetVersion() {
  const args = process.argv.slice(2);
  const versionIdx = args.indexOf("--version");
  if (versionIdx !== -1 && args[versionIdx + 1]) {
    return args[versionIdx + 1];
  }
  // Read from first non-private package
  const rootPkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, "packages", "core", "package.json"), "utf-8")
  );
  return rootPkg.version;
}

/**
 * Collect changelog entries from all packages for the given version
 */
function collectChanges(version) {
  const packages = fs.readdirSync(PACKAGES_DIR).filter((dir) => {
    const pkgPath = path.join(PACKAGES_DIR, dir, "package.json");
    if (!fs.existsSync(pkgPath)) return false;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return !pkg.private;
  });

  const changes = [];

  for (const dir of packages) {
    const pkgPath = path.join(PACKAGES_DIR, dir, "package.json");
    const changelogPath = path.join(PACKAGES_DIR, dir, "CHANGELOG.md");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const body = parseChangelog(changelogPath, version);

    if (body) {
      changes.push({
        name: pkg.name,
        body: body,
      });
    }
  }

  return changes;
}

const injectEmojis = (text) => emoji.emojify(text);

/**
 * Convert markdown-like text to basic HTML
 */
function simpleMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/gs, (match) => `<ul>${match}</ul>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "<br/>")
    .replace(/\n/g, "\n");
}

/**
 * Build HTML for the grouped release image
 */
function buildHTML(version, changes) {
  let aiSummaryHtml = "";
  const releaseBodyPath = path.join(ROOT, "RELEASE_BODY.md");
  if (fs.existsSync(releaseBodyPath)) {
    const content = fs.readFileSync(releaseBodyPath, "utf-8");
    const highlightsMatch = content.match(/## 🌟 Highlights\n([\s\S]*?)(?=\n## |$)/);
    if (highlightsMatch) {
      const summaryText = highlightsMatch[1].trim();
      aiSummaryHtml = `
      <div class="ai-summary">
        <h3>✨ AI Release Summary</h3>
        <div class="summary-content">${simpleMarkdown(injectEmojis(summaryText))}</div>
      </div>
      `;
    }
  }

  const packageSections = changes
    .map(
      ({ name, body }) => `
      <div class="package">
        <h3>${name.replace("@open-wa/", "")}</h3>
        <div class="changes">${simpleMarkdown(injectEmojis(body))}</div>
      </div>
    `
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400|Roboto+Mono:300|Roboto+Slab:400,700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Open Sans', sans-serif;
        font-weight: 300;
        background: #282a36;
        color: #f8f8f2;
        padding: 2em;
        max-width: 900px;
      }
      h2 {
        font-family: 'Roboto Slab', serif;
        color: #ff79c6;
        font-weight: 700;
        font-size: 1.8em;
        margin-bottom: 0.3em;
      }
      .subtitle {
        color: #6272a4;
        font-size: 0.9em;
        margin-bottom: 1.5em;
        border-bottom: 1px solid #44475a;
        padding-bottom: 1em;
      }
      .ai-summary {
        background: rgba(80, 250, 123, 0.05);
        border: 1px dashed #50fa7b;
        border-radius: 6px;
        padding: 1.2em;
        margin-bottom: 1.5em;
      }
      .ai-summary h3 {
        color: #50fa7b;
        font-family: 'Roboto Slab', serif;
        font-weight: 400;
        font-size: 1.1em;
        margin-bottom: 0.5em;
      }
      .summary-content {
        line-height: 1.5;
        font-size: 0.9em;
      }
      .summary-content strong {
        color: #ff79c6;
      }
      .package {
        margin-bottom: 1.2em;
      }
      .package h3 {
        font-family: 'Roboto Slab', serif;
        color: #8be9fd;
        font-weight: 400;
        font-size: 1.1em;
        margin-bottom: 0.3em;
      }
      .changes {
        padding-left: 0.5em;
        border-left: 2px solid #44475a;
        margin-left: 0.3em;
      }
      ul {
        list-style: none;
        padding-left: 0;
      }
      li {
        padding: 0.15em 0;
        font-size: 0.85em;
        line-height: 1.4;
      }
      li::before {
        content: "→ ";
        color: #50fa7b;
      }
      code {
        font-family: 'Roboto Mono', monospace;
        font-size: 0.85em;
        background: #44475a;
        border-radius: 3px;
        padding: 0 4px;
      }
      a {
        color: #bd93f9;
        text-decoration: none;
      }
      strong {
        color: #ffb86c;
        font-weight: 400;
      }
      h3.section-head {
        color: #f1fa8c;
        font-size: 0.9em;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 0.3em;
      }
      .footer {
        margin-top: 1.5em;
        padding-top: 1em;
        border-top: 1px solid #44475a;
        color: #6272a4;
        font-size: 0.75em;
      }
    </style>
  </head>
  <body>
    <h2>@open-wa v${version}</h2>
    <div class="subtitle">${changes.length} package${changes.length !== 1 ? "s" : ""} updated</div>
    ${aiSummaryHtml}
    ${packageSections}
    <div class="footer">open-wa/wa-automate-nodejs</div>
  </body>
</html>`;
}

async function run() {
  const version = getTargetVersion();
  console.log(`Generating release image for v${version}...`);

  const changes = collectChanges(version);

  if (changes.length === 0) {
    console.log("No changelog entries found for this version. Generating placeholder.");
    // Still generate an image with the version so GitHub release has something
    changes.push({
      name: "@open-wa/core",
      body: "Internal improvements and dependency updates.",
    });
  }

  console.log(`Found changes in ${changes.length} packages:`);
  changes.forEach((c) => console.log(`  - ${c.name}`));

  const html = buildHTML(version, changes);

  const browser = await puppeteer.launch({ headless: "new", timeout: 0 });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 900, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.evaluate("document.fonts.ready");

  const bounds = await page.evaluate(
    "document.documentElement.getBoundingClientRect().toJSON()"
  );

  const outputPath = path.join(ROOT, "release.png");
  await page.screenshot({
    path: outputPath,
    encoding: "binary",
    type: "png",
    clip: {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    },
  });

  console.log(`Wrote release image to ${outputPath}`);
  await browser.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed to generate release image:", err);
  process.exit(1);
});
