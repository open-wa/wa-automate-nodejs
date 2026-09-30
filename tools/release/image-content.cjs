const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const editorial = require("./image-highlights.json");

function renderMarkdown(text) {
  return execFileSync("gh", ["api", "markdown", "--method", "POST", "--input", "-", "-H", "Accept: text/html"], {
    input: JSON.stringify({ text, mode: "gfm", context: "open-wa/wa-automate-nodejs" }),
    encoding: "utf8", maxBuffer: 10 * 1024 * 1024, timeout: 60000,
  });
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

// Parse the changelog's entry boundaries only; GitHub renders the Markdown.
function entries(body) {
  const result = [];
  let severity = "patch";
  let current;
  for (const line of body.split(/\r?\n/)) {
    if (/^<sub>.*<\/sub>$/.test(line.trim())) continue;
    const section = line.match(/^### (Major|Minor|Patch) Changes\s*$/i);
    if (section) { severity = section[1].toLowerCase(); current = undefined; continue; }
    const bullet = line.match(/^- (.*)$/);
    if (bullet) {
      const level = bullet[1].match(/\*\((major|minor|patch)\)\*/)?.[1] || severity;
      const content = bullet[1]
        .replace(/^.*?Thanks \[.*?!\s*(?:-\s*)?/, "")
        .replace(/^\[#\d+\]\([^)]+\)\s*/, "")
        .replace(/^\*\((major|minor|patch)\)\*\s*(?:-\s*)?/, "");
      current = { severity: level, lines: [content] };
      result.push(current);
    } else if (current) {
      current.lines.push(line.replace(/^ {2}/, ""));
    } else if (line.trim()) {
      current = { severity, lines: [line] };
      result.push(current);
    }
  }
  return result.map(({ severity, lines }) => ({ severity, markdown: lines.join("\n").trim() })).filter(e => e.markdown);
}

function previousReleaseTag(version) {
  let previous;
  try {
    const compare = (a, b) => {
      const [ac, ...ap] = a.slice(1).split("-");
      const [bc, ...bp] = b.slice(1).split("-");
      const core = ac.localeCompare(bc, "en", { numeric: true });
      if (core) return core;
      if (!ap.length || !bp.length) return Number(!ap.length) - Number(!bp.length);
      return ap.join("-").localeCompare(bp.join("-"), "en", { numeric: true });
    };
    const tags = execFileSync("git", ["tag", "--list", "v*"], { cwd: ROOT, encoding: "utf8" }).trim().split("\n")
      .filter(tag => /^v\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(tag));
    previous = tags.filter(tag => compare(tag, `v${version}`) < 0).sort(compare).at(-1);
  } catch { /* Exact-version changelogs still work in a shallow checkout. */ }
  return previous;
}

function collectChanges(version) {
  // Include independently versioned companions without replaying old changelogs.
  const previous = previousReleaseTag(version);
  const currentRelease = JSON.parse(fs.readFileSync(path.join(ROOT, "packages/core/package.json"), "utf8")).version === version;
  return ["packages", "integrations", "sdks"].flatMap(workspace => {
    const directory = path.join(ROOT, workspace);
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory).flatMap(dir => {
      const folder = path.join(directory, dir);
      const manifest = path.join(folder, "package.json");
      if (!fs.existsSync(manifest)) return [];
      const pkg = JSON.parse(fs.readFileSync(manifest, "utf8"));
      if (pkg.private) return [];
      let packageVersion = version;
      if (pkg.version !== version && currentRelease && previous) {
        try {
          const old = JSON.parse(execFileSync("git", ["show", `${previous}:${workspace}/${dir}/package.json`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
          if (old.version !== pkg.version) packageVersion = pkg.version;
        } catch { /* No previous manifest: use only an exact version match. */ }
      }
      const body = changelogBody(path.join(folder, "CHANGELOG.md"), packageVersion);
      return body ? [{ name: pkg.name, version: packageVersion, body }] : [];
    });
  });
}

function groupChanges(version, changes) {
  const config = editorial[version] || {};
  const groups = new Map();
  const maintenance = new Set();
  for (const pkg of changes) {
    for (const entry of entries(pkg.body)) {
      if (/^(?:Version (?:bump|alignment)|Updated dependenc(?:y|ies)|Dependency (?:updates?|sync)|No changes in this release)\b/i.test(entry.markdown.replace(/^[^\p{L}\d]+/u, ""))) {
        maintenance.add(pkg.name);
        continue;
      }
      const key = entry.markdown.trim();
      const group = groups.get(key) || { markdown: key, severity: entry.severity, packages: [] };
      if (({ major: 3, minor: 2, patch: 1 }[entry.severity]) > ({ major: 3, minor: 2, patch: 1 }[group.severity])) group.severity = entry.severity;
      if (!group.packages.includes(pkg.name)) group.packages.push(pkg.name);
      groups.set(key, group);
    }
  }
  const priority = name => config.packages?.indexOf(name) >= 0 ? config.packages.indexOf(name) : 999;
  const ranked = [...groups.values()].map(group => {
    group.packages.sort((a, b) => priority(a) - priority(b) || a.localeCompare(b));
    return group;
  }).sort((a, b) => {
    const score = group => (/\b(?:security|vulnerability|breaking)\b/i.test(group.markdown) ? 4 : { major: 3, minor: 2, patch: 1 }[group.severity]);
    return score(b) - score(a) || priority(a.packages[0]) - priority(b.packages[0]) || a.packages[0].localeCompare(b.packages[0]);
  });
  for (const group of ranked) for (const name of group.packages) maintenance.delete(name);
  return { ranked, maintenance: [...maintenance].sort() };
}

function releaseContent(version, changes) {
  const config = editorial[version] || {};
  const { ranked, maintenance } = groupChanges(version, changes);
  const notesFile = path.join(ROOT, "RELEASE_BODY.md");
  const notes = fs.existsSync(notesFile) ? fs.readFileSync(notesFile, "utf8") : "";
  const heading = notes.match(/^# (.+)$/m)?.[1];
  const firstChange = ranked[0]?.markdown.match(/^#{1,6} (.+)$/m)?.[1];
  const firstParagraph = ranked[0]?.markdown.split(/\n\s*\n/).find(p => !p.startsWith("#")) || "The latest improvements for your WhatsApp integrations.";
  const headline = config.headline || firstChange || (heading && !/^@?open-?wa\b.*\d/i.test(heading) ? heading : firstParagraph.replace(/\n/g, " "));
  const summary = config.summary || firstParagraph;
  const sections = ranked.map(group => ({
    label: group.packages.length > 5 ? `Across ${group.packages.length} packages` : group.packages.join(" · "),
    markdown: group.markdown,
  }));
  if (maintenance.length) sections.push({
    label: "🔖 Version alignment",
    markdown: `${maintenance.length} companion packages receive version or dependency updates. No separate feature changes.`,
  });
  const markdown = sections.map((section, index) => `# OPENWA-CHANGE-${index}\n\n${section.markdown}`).join("\n\n");
  return { headline, summary, customHeadline: !!config.headline, customSummary: !!config.summary, badge: config.badge || `${ranked.length} substantive changes`, sections, html: renderMarkdown(markdown), coverHtml: renderMarkdown(`# ${headline}\n\n${summary}`) };
}

module.exports = { collectChanges, groupChanges, previousReleaseTag, releaseContent, renderMarkdown };
