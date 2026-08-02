import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../..');
const docsRoot = path.join(repoRoot, 'apps/docs/content/docs');

const contractions = /\b(?:aren't|can't|couldn't|didn't|doesn't|don't|hadn't|hasn't|haven't|isn't|mustn't|shouldn't|wasn't|weren't|won't|wouldn't|you'll|you've|you're|we'll|we've|we're|they'll|they've|they're|it's|that's|there's|what's|who's|let's)\b/i;
const restrictedWords = /\b(?:acceptable|avoid|both|ensure|further|however|insert|main|may|now|people|perform|portion|reach|repeat|required|rotate|secure|shall|should|since|therefore|using)\b/i;

function walk(directory, predicate) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', '.turbo'].includes(entry.name)) return [];
      return walk(entryPath, predicate);
    }
    return predicate(entryPath) ? [entryPath] : [];
  });
}

function publicFiles() {
  const files = [path.join(repoRoot, 'README.md'), path.join(repoRoot, 'apps/docs/STE_STYLE.md')];
  files.push(...walk(docsRoot, (file) => /\.(?:md|mdx)$/.test(file)));

  for (const rootName of ['apps', 'packages', 'integrations']) {
    files.push(...walk(path.join(repoRoot, rootName), (file) => path.basename(file) === 'README.md'));
  }

  return [...new Set(files)].sort();
}

function cleanLine(line) {
  return line
    .replace(/^\s*(?:title|description):\s*/i, '')
    .replace(/`[^`]*`/g, ' TERM ')
    .replace(/!?(?:\[([^\]]*)\])\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^{}]*\}/g, ' TERM ')
    .replace(/^\s{0,3}(?:#{1,6}|>|[-*+] |\d+[.)] )\s*/, '')
    .replace(/\|/g, ' ')
    .replace(/[*_~]/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/https?:\/\/\S+/g, ' URL ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(text) {
  return text.match(/[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*/g)?.length ?? 0;
}

function sentencesIn(text) {
  const normalized = text
    .replace(/\b(?:e\.g|i\.e|U\.S|vs)\./g, (value) => value.replaceAll('.', ''))
    .replace(/\b\d+\.\d+(?:\.\d+)*\b/g, (value) => value.replaceAll('.', '-'));
  return normalized.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)?.filter((value) => value.trim()) ?? [];
}

const findings = [];

for (const file of publicFiles()) {
  const relativeFile = path.relative(repoRoot, file);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  let fenceLength = 0;
  let inJsxBlock = false;
  let inFrontmatter = false;
  let paragraph = [];

  function addFinding(rule, line, detail) {
    findings.push({ rule, file: relativeFile, line, detail });
  }

  function flushParagraph() {
    if (paragraph.length === 0) return;
    const text = paragraph.map((item) => item.text).join(' ');
    const sentences = sentencesIn(text);

    if (sentences.length > 6) {
      addFinding('paragraph-length', paragraph[0].line, `${sentences.length} sentences`);
    }

    let offset = 0;
    for (const sentence of sentences) {
      const source = paragraph.find((item) => offset < item.end) ?? paragraph[0];
      const count = wordCount(sentence);
      const limit = source.procedure ? 20 : 25;
      if (count > limit) {
        addFinding(source.procedure ? 'instruction-length' : 'description-length', source.line, `${count} words`);
      }
      offset += sentence.length;
    }

    paragraph = [];
  }

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const lineNumber = index + 1;

    if (index === 0 && raw.trim() === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (raw.trim() === '---') inFrontmatter = false;
      continue;
    }

    const fence = raw.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      const markerLength = fence[1].length;
      if (fenceLength === 0) fenceLength = markerLength;
      else if (markerLength >= fenceLength) fenceLength = 0;
      flushParagraph();
      continue;
    }
    if (fenceLength > 0) continue;

    if (/^\s*<[A-Z][\w.]*\b/.test(raw) && !/>\s*$/.test(raw)) {
      inJsxBlock = true;
      flushParagraph();
      continue;
    }
    if (inJsxBlock) {
      if (/^\s*<\/[A-Z][\w.]*>\s*$/.test(raw) || />\s*$/.test(raw)) inJsxBlock = false;
      continue;
    }
    if (/^\s*<\/?[A-Z][^>]*>\s*$/.test(raw) || /^\s*(?:import|export)\s/.test(raw)) {
      flushParagraph();
      continue;
    }
    if (/^\s*\[[^\]]+\]:\s*\S+/.test(raw) || /^\s*\|?\s*:?-{3,}/.test(raw)) continue;

    const text = cleanLine(raw);
    if (!text) {
      flushParagraph();
      continue;
    }

    const prose = raw.split(/(`[^`]*`)/g).filter((_, part) => part % 2 === 0).join('');
    if (prose.includes(';')) addFinding('semicolon', lineNumber, 'Use a period or comma.');

    const contraction = text.match(contractions);
    if (contraction) addFinding('contraction', lineNumber, contraction[0]);

    const restricted = text.match(restrictedWords);
    if (restricted) addFinding('restricted-word', lineNumber, restricted[0]);

    const procedure = /^\s{0,3}\d+[.)]\s+/.test(raw);
    const listItem = /^\s{0,3}(?:\d+[.)]|[-*+])\s+/.test(raw);
    const tableRow = /^\s*\|/.test(raw);
    if (listItem || tableRow) flushParagraph();
    if (tableRow) continue;

    const start = paragraph.reduce((sum, item) => sum + item.text.length + 1, 0);
    paragraph.push({ text, line: lineNumber, procedure, end: start + text.length });
    if (listItem) flushParagraph();
  }

  flushParagraph();
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.rule}] ${finding.detail}`);
  }
  console.error(`\nSTE check failed with ${findings.length} finding${findings.length === 1 ? '' : 's'}.`);
  process.exitCode = 1;
} else {
  console.log('STE check passed.');
}
