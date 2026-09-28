"use strict";

/** Render a readable cover and paginated package changelog sheets. */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const ROOT = path.join(__dirname, "..");
const PACKAGES_DIR = path.join(ROOT, "packages");
const WIDTH = 1440;
const HEIGHT = 900;

function targetVersion() {
  const index = process.argv.indexOf("--version");
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return JSON.parse(fs.readFileSync(path.join(PACKAGES_DIR, "core/package.json"), "utf8")).version;
}

function changelogBody(file, version) {
  if (!fs.existsSync(file)) return null;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^##\s+\[?(\d+\.\d+\.\d+[^\]\s]*)\]?/);
    if (!match) continue;
    if (start !== -1) return lines.slice(start, i).join("\n").trim() || null;
    if (match[1] === version) start = i + 1;
  }
  return start === -1 ? null : lines.slice(start).join("\n").trim() || null;
}

function collectChanges(version) {
  return fs.readdirSync(PACKAGES_DIR).flatMap((dir) => {
    const folder = path.join(PACKAGES_DIR, dir);
    const manifest = path.join(folder, "package.json");
    if (!fs.existsSync(manifest)) return [];
    const pkg = JSON.parse(fs.readFileSync(manifest, "utf8"));
    if (pkg.private) return [];
    const body = changelogBody(path.join(folder, "CHANGELOG.md"), version);
    return body ? [{ name: pkg.name, body }] : [];
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function blocksFor(changes) {
  return changes.flatMap(({ name, body }) => body.split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const trimmed = line.trim();
      const type = trimmed.startsWith("### ") ? "section"
        : /^\s*- /.test(line) ? (/^\s{2,}- /.test(line) ? "nested" : "bullet")
          : "paragraph";
      const content = type === "section" ? trimmed.slice(4)
        : type === "bullet" || type === "nested" ? trimmed.slice(2) : trimmed;
      return { package: name, type, html: inlineMarkdown(content) };
    }));
}

function releaseSubtitle(version) {
  return version.includes("-") ? "PRE-RELEASE NOTES" : "RELEASE NOTES";
}

function releaseStory(version) {
  if (version !== "5.0.0") return [];
  const notes = fs.readFileSync(path.join(ROOT, "tools/release/v5-release-notes.md"), "utf8");
  const sections = [...notes.matchAll(/^## (What changes for v4 users|Before you migrate)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
  if (sections.length !== 2) throw new Error("v5 release story sections are missing");
  const cards = sections.map(([, , body]) => [...body.matchAll(/^### (\d+) \/ (.+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)]
    .map(([, number, title, copy]) => ({ number, title, copy: copy.trim() })));
  if (cards[0].length !== 6 || cards[1].length !== 3) {
    throw new Error("v5 release story requires six value points and three migration points");
  }
  return [
    { title: "Run it your way", deck: "A clearer boundary between the WhatsApp session and the code that uses it.", cards: cards[0].slice(0, 3) },
    { title: "Build on it", deck: "One method surface, with more ways to extend and inspect it.", cards: cards[0].slice(3) },
    { title: "Move from v4", deck: "A major version deserves a deliberate migration.", cards: cards[1] },
  ];
}

function storyHtml(story, version) {
  return story.map(({ title, deck, cards }, index) => `<section class="page sheet story"><div class="sheet-inner">
    <div class="sheet-top"><span class="sheet-brand">openwa</span><span class="sheet-meta">RELEASE NOTES / ${String(index + 2).padStart(2, "0")}</span></div>
    <div class="story-heading"><div><div class="story-kicker">FROM V4 TO V5</div><h2>${escapeHtml(title)}</h2></div><span class="sheet-version">v${escapeHtml(version)}</span></div>
    <p class="story-deck">${escapeHtml(deck)}</p>
    <div class="story-cards">${cards.map((card) => `<article class="story-card"><span class="story-number">${escapeHtml(card.number)}</span><h3>${escapeHtml(card.title)}</h3><p>${inlineMarkdown(card.copy)}</p></article>`).join("")}</div>
    <div class="sheet-bottom"><span>open-wa / v4 → v5</span><span>${String(index + 2).padStart(2, "0")} / TOTAL</span></div>
  </div></section>`).join("");
}

function documentHtml(version, count, story) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing:border-box; }
    html, body { margin:0; padding:0; }
    body { font-family:Inter,Arial,sans-serif; color:#12151c; }
    .page { position:relative; width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; }
    .cover { background:#12151c; color:white; }
    .mesh { position:absolute; inset:0 0 0 38%; overflow:hidden; background:linear-gradient(130deg,#9fb6f2 0%,#2d6bff 39%,#2055e6 78%,#121c54 100%); }
    .mesh:before { content:""; position:absolute; width:1050px; height:1050px; left:-100px; top:-255px; border-radius:44%; transform:rotate(-26deg); background:radial-gradient(ellipse at 36% 32%,#f7f8fa 0%,#b8c9f8 19%,#2d6bff 42%,#102d93 60%,transparent 70%); filter:blur(27px); opacity:.78; }
    .mesh:after { content:""; position:absolute; width:760px; height:760px; right:-225px; bottom:-300px; border-radius:47%; transform:rotate(28deg); background:radial-gradient(ellipse at 36% 35%,#a3b7f5 0%,#416feb 28%,#182565 65%,transparent 73%); filter:blur(37px); opacity:.9; }
    .cover:after { content:""; position:absolute; inset:0; background:linear-gradient(90deg,#12151c 0%,#12151c 31%,transparent 72%); pointer-events:none; }
    .cover-content { position:relative; z-index:1; height:100%; padding:72px 80px 66px; display:flex; flex-direction:column; }
    .mast { display:flex; align-items:center; justify-content:space-between; font-weight:700; font-size:22px; }
    .mast .issue { font-size:16px; letter-spacing:.13em; color:#e7eeff; }
    .cover-main { margin-top:145px; }
    .eyebrow { color:#a3b7f5; font-size:18px; font-weight:700; letter-spacing:.15em; }
    .cover-title { margin:28px 0 0; font-family:'Bricolage Grotesque',Inter,sans-serif; font-size:132px; line-height:.94; letter-spacing:-.045em; font-weight:800; }
    .cover-deck { margin:35px 0 0; max-width:700px; font-size:27px; line-height:1.38; color:#e7eeff; }
    .cover-bottom { margin-top:auto; border-top:1px solid #8b9bc3; padding-top:25px; display:flex; align-items:flex-end; justify-content:space-between; font-size:18px; line-height:1.5; }
    .cover-bottom span:last-child { font-size:16px; color:#e7eeff; }
    .sheet { background:#f7f8fa; }
    .sheet:before { content:""; position:absolute; top:0; left:0; width:100%; height:15px; background:#2d6bff; }
    .sheet-inner { padding:60px 72px 54px; height:100%; display:flex; flex-direction:column; }
    .sheet-top { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #d7ddeb; padding-bottom:26px; }
    .sheet-brand { font-size:20px; font-weight:700; letter-spacing:-.03em; }
    .sheet-meta { color:#2055e6; font-size:15px; letter-spacing:.12em; font-weight:700; }
    .sheet-heading { display:flex; justify-content:space-between; align-items:flex-end; padding:30px 0 23px; }
    .sheet-title { font-family:'Bricolage Grotesque',Inter,sans-serif; font-size:60px; font-weight:800; letter-spacing:-.06em; line-height:1; }
    .sheet-version { color:#5272c5; font-size:21px; font-weight:600; }
    .columns { display:flex; gap:50px; flex:1; min-height:0; }
    .column { flex:1; height:100%; overflow:hidden; }
    .package-title { font-family:'Bricolage Grotesque',Inter,sans-serif; font-weight:800; font-size:27px; line-height:1.15; letter-spacing:-.035em; color:#2055e6; border-top:3px solid #2d6bff; padding-top:14px; margin:0 0 14px; }
    .package-title.continued:after { content:"  /  continued"; font:600 14px Inter,Arial,sans-serif; letter-spacing:.02em; color:#7b8aa9; }
    .block { font-size:20px; line-height:1.34; margin:0 0 12px; overflow-wrap:anywhere; }
    .block.section { font-size:14px; line-height:1.3; color:#687895; font-weight:700; letter-spacing:.12em; text-transform:uppercase; margin:18px 0 13px; }
    .block.bullet, .block.nested { position:relative; padding-left:24px; }
    .block.bullet:before, .block.nested:before { content:""; position:absolute; left:0; top:11px; width:7px; height:7px; background:#2d6bff; border-radius:50%; }
    .block.nested { color:#59677d; font-size:17px; line-height:1.3; padding-left:35px; margin-bottom:7px; }
    .block.nested:before { left:15px; width:5px; height:5px; background:#a3b7f5; }
    .block strong { font-weight:700; }
    .block code { font:600 .86em Inter,Arial,sans-serif; background:#e7eeff; padding:1px 4px; border-radius:3px; }
    .sheet-bottom { border-top:1px solid #d7ddeb; margin-top:21px; padding-top:17px; display:flex; justify-content:space-between; font-size:15px; font-weight:600; color:#687895; }
    .story-heading { display:flex; justify-content:space-between; align-items:flex-end; padding:29px 0 0; }
    .story-kicker { color:#2055e6; font-size:15px; font-weight:700; letter-spacing:.13em; margin-bottom:10px; }
    .story-heading h2 { margin:0; font-family:'Bricolage Grotesque',Inter,sans-serif; font-size:67px; line-height:1; font-weight:800; letter-spacing:-.06em; }
    .story-deck { margin:17px 0 18px; color:#526176; font-size:21px; line-height:1.35; }
    .story-cards { flex:1; display:flex; flex-direction:column; min-height:0; }
    .story-card { border-top:1px solid #cbd5e7; display:grid; grid-template-columns:58px 410px 1fr; gap:20px; align-items:start; flex:1; padding:25px 0 16px; }
    .story-number { color:#2055e6; font-size:18px; font-weight:700; letter-spacing:.08em; }
    .story-card h3 { margin:0; font-family:'Bricolage Grotesque',Inter,sans-serif; font-size:34px; line-height:1.06; letter-spacing:-.045em; }
    .story-card p { margin:0; font-size:20px; line-height:1.34; color:#3c4859; overflow-wrap:anywhere; }
    .story-card code { font:600 .86em Inter,Arial,sans-serif; background:#e7eeff; padding:1px 4px; border-radius:3px; }
  </style></head><body>
    <section class="page cover" id="cover"><div class="mesh"></div><div class="cover-content">
      <div class="mast"><span>openwa</span><span class="issue">${escapeHtml(releaseSubtitle(version))} / 01</span></div>
      <div class="cover-main"><div class="eyebrow">OPENWA · RELEASE ${escapeHtml(version)}</div>
        <h1 class="cover-title">OpenWA<br>${escapeHtml(version)}</h1>
        <p class="cover-deck">${story.length ? "Three years in the making. A new foundation for everyone coming from v4." : `Changes across ${count} packages, laid out for reading.`}</p></div>
      <div class="cover-bottom"><span>${story.length ? "A guide for v4 users" : `${count} package changelogs`}<br>${count} package changelogs.</span><span>${story.length ? "Start with what changed →" : "Package changes follow →"}</span></div>
    </div></section><main id="story">${storyHtml(story, version)}</main><main id="sheets"></main>
  </body></html>`;
}

async function paginate(page, blocks, version, storyCount) {
  return page.evaluate(({ blocks, version, storyCount }) => {
    const sheets = document.getElementById("sheets");
    let pageNumber = 0;
    let columnNumber = 0;
    let column;
    let currentPackage = "";
    const makeColumn = () => {
      if (columnNumber % 2 === 0) {
        pageNumber++;
        const sheet = document.createElement("section");
        sheet.className = "page sheet";
        sheet.innerHTML = `<div class="sheet-inner"><div class="sheet-top"><span class="sheet-brand">openwa</span><span class="sheet-meta">RELEASE NOTES / ${String(pageNumber + storyCount + 1).padStart(2, "0")}</span></div><div class="sheet-heading"><span class="sheet-title">Package changes</span><span class="sheet-version">v${version}</span></div><div class="columns"><div class="column"></div><div class="column"></div></div><div class="sheet-bottom"><span>open-wa / changelog</span><span>${String(pageNumber + storyCount + 1).padStart(2, "0")} / TOTAL</span></div></div>`;
        sheets.appendChild(sheet);
      }
      const sheet = sheets.lastElementChild;
      column = sheet.querySelectorAll(".column")[columnNumber % 2];
      columnNumber++;
      currentPackage = "";
    };
    const titleFor = (name, continued) => {
      const title = document.createElement("h2");
      title.className = `package-title${continued ? " continued" : ""}`;
      title.textContent = name;
      return title;
    };
    makeColumn();
    const seen = new Set();
    for (const block of blocks) {
      const item = document.createElement("div");
      item.className = `block ${block.type}`;
      item.innerHTML = block.html;
      let title;
      if (currentPackage !== block.package) {
        title = titleFor(block.package, seen.has(block.package));
        column.appendChild(title);
      }
      column.appendChild(item);
      if (column.scrollHeight > column.clientHeight + 1) {
        item.remove();
        if (title) title.remove();
        makeColumn();
        title = titleFor(block.package, seen.has(block.package));
        column.appendChild(title);
        column.appendChild(item);
        if (column.scrollHeight > column.clientHeight + 1) {
          throw new Error(`Changelog line is taller than a page: ${block.package}`);
        }
      }
      currentPackage = block.package;
      seen.add(block.package);
    }
    for (const sheet of sheets.children) {
      sheet.querySelector(".sheet-bottom span:last-child").textContent = `${String([...sheets.children].indexOf(sheet) + storyCount + 2).padStart(2, "0")} / ${String(pageNumber + storyCount + 1).padStart(2, "0")}`;
    }
    for (const sheet of document.querySelectorAll(".story")) {
      const number = [...document.querySelectorAll(".story")].indexOf(sheet) + 2;
      sheet.querySelector(".sheet-bottom span:last-child").textContent = `${String(number).padStart(2, "0")} / ${String(pageNumber + storyCount + 1).padStart(2, "0")}`;
    }
    return pageNumber;
  }, { blocks, version, storyCount });
}

async function run() {
  const version = targetVersion();
  const changes = collectChanges(version);
  if (!changes.length) throw new Error(`No package changelogs found for v${version}`);
  const story = releaseStory(version);
  console.log(`Rendering v${version}: ${changes.length} package changelogs`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: process.env.RELEASE_IMAGE_NO_SANDBOX === "1"
      ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
    await page.setContent(documentHtml(version, changes.length, story), { waitUntil: "domcontentloaded" });
    await page.evaluate(() => Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 10000)),
    ]));
    await paginate(page, blocksFor(changes), version, story.length);
    const pages = await page.$$(".page");
    for (let i = 0; i < pages.length; i++) {
      const file = i === 0 ? "release.png" : `release-${String(i + 1).padStart(2, "0")}.png`;
      await pages[i].screenshot({ path: path.join(ROOT, file), type: "png" });
      console.log(`Wrote ${file}`);
    }
    console.log(`Rendered ${pages.length} readable release images`);
  } finally {
    await browser.close();
  }
}

run().catch((error) => { console.error("Release image failed:", error); process.exitCode = 1; });
