#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Parse args
const args = process.argv.slice(2);
const planPath = args[0];
const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'standard';
const context = args.includes('--c') ? args[args.indexOf('--c') + 1] : '';
const MAX_CONTEXT_FILES = 30;
const TEXT_FILE_EXTENSIONS = new Set([
    '.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx',
    '.json', '.md', '.txt', '.yml', '.yaml', '.toml',
    '.sh', '.ps1', '.py', '.java', '.go', '.rs',
    '.html', '.css', '.scss', '.xml'
]);

if (!planPath) {
    console.error('Usage: verify_plan <plan_path> [--mode <standard|adversarial>] [--c <context_string>]');
    process.exit(1);
}

const workspace = process.cwd();
const absolutePlanPath = path.resolve(workspace, planPath);

if (!fs.existsSync(absolutePlanPath)) {
    console.error(`Error: Plan not found at ${absolutePlanPath}`);
    process.exit(1);
}

// Read Plan
const planContent = fs.readFileSync(absolutePlanPath, 'utf8');
const planDir = path.dirname(absolutePlanPath);

const filesToRead = new Set();
const unresolvedBasenames = new Set();

function stripWrapping(token) {
    if (!token) return '';
    let cleaned = String(token).trim();
    cleaned = cleaned.replace(/^[`"'([{<]+/, '').replace(/[`"')\]}>.,;:!?]+$/, '');
    if (cleaned.startsWith('file:///')) {
        cleaned = cleaned.slice('file:///'.length);
    }
    return cleaned.trim();
}

function looksLikePathToken(token) {
    if (!token) return false;
    if (/^https?:\/\//i.test(token)) return false;
    if (token.startsWith('#')) return false;
    if (token.includes('/') || token.includes('\\')) return true;
    return false;
}

function isTextFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return TEXT_FILE_EXTENSIONS.has(ext);
}

function tryResolveFile(candidate) {
    const clean = stripWrapping(candidate);
    if (!clean) return;
    if (/^\$\{.*\}$/.test(clean)) return;
    if (/^[a-z]+:\/\//i.test(clean)) return;

    const normalized = clean.replace(/^\.\/+/, './');
    const tryPaths = [];
    if (path.isAbsolute(normalized)) {
        tryPaths.push(path.normalize(normalized));
    } else {
        tryPaths.push(path.resolve(workspace, normalized));
        tryPaths.push(path.resolve(planDir, normalized));
    }

    for (const abs of tryPaths) {
        try {
            if (fs.existsSync(abs) && fs.statSync(abs).isFile() && isTextFile(abs)) {
                filesToRead.add(abs);
                return;
            }
        } catch {
            // ignore resolution errors
        }
    }

    if (/^[\w.\-]+\.[A-Za-z0-9]+$/.test(clean)) {
        unresolvedBasenames.add(clean.toLowerCase());
    }
}

function collectCandidates(text) {
    const candidates = [];
    if (!text) return candidates;

    const patterns = [
        /\[[^\]]+\]\(([^)]+)\)/g,
        /`([^`\n]+)`/g,
        /(?:^|[\s(])([A-Za-z]:[\\/][^\s"'`<>|]+|\.{1,2}[\\/][^\s"'`<>|]+|[A-Za-z0-9_.-]+(?:[\\/][A-Za-z0-9_.-]+)+)/g
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const token = stripWrapping(match[1] || match[0]);
            if (!token) continue;
            candidates.push(token);
        }
    }

    // Also collect bare filenames like register-tools.js
    const bareFileRegex = /\b([A-Za-z0-9_.-]+\.(?:js|ts|tsx|jsx|md|json|yml|yaml|py|sh|ps1))\b/g;
    let fileMatch;
    while ((fileMatch = bareFileRegex.exec(text)) !== null) {
        candidates.push(stripWrapping(fileMatch[1]));
    }

    return candidates;
}

function buildBasenameIndex(root) {
    const index = new Map();
    const skipDirs = new Set(['.git', 'node_modules', '.switchboard/archive', 'dist', 'out', 'coverage']);

    const walk = (dir) => {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            const rel = path.relative(root, full).replace(/\\/g, '/');
            if (entry.isDirectory()) {
                if (skipDirs.has(entry.name) || skipDirs.has(rel)) continue;
                walk(full);
                continue;
            }
            if (!entry.isFile()) continue;
            if (!isTextFile(full)) continue;

            const key = entry.name.toLowerCase();
            if (!index.has(key)) index.set(key, []);
            index.get(key).push(full);
        }
    };

    walk(root);
    return index;
}

const candidateText = `${planContent}\n${context || ''}`;
const candidates = collectCandidates(candidateText);
for (const token of candidates) {
    if (looksLikePathToken(token) || /^[\w.\-]+\.[A-Za-z0-9]+$/.test(token)) {
        tryResolveFile(token);
    }
}

if (unresolvedBasenames.size > 0) {
    const basenameIndex = buildBasenameIndex(workspace);
    for (const base of unresolvedBasenames) {
        const hits = basenameIndex.get(base) || [];
        if (hits.length === 1) {
            filesToRead.add(hits[0]);
        }
    }
}

const contextFiles = Array.from(filesToRead).sort().slice(0, MAX_CONTEXT_FILES);

console.log(`\n# VERIFICATION CONTEXT\n`);
console.log(`## Plan: ${path.basename(absolutePlanPath)}\n`);
console.log(planContent);
console.log(`\n## Context Files (${contextFiles.length}${filesToRead.size > MAX_CONTEXT_FILES ? ` of ${filesToRead.size}` : ''})\n`);

contextFiles.forEach(filePath => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`\n### File: ${path.relative(workspace, filePath)}\n`);
        console.log('```' + path.extname(filePath).substring(1));
        console.log(content);
        console.log('```');
    } catch (e) {
        console.log(`\n### File: ${path.relative(workspace, filePath)} (Error reading: ${e.message})\n`);
    }
});

// Run basic validation (optional)
console.log(`\n## Automated Checks\n`);
try {
    // Check for "lint" script
    const packageJson = JSON.parse(fs.readFileSync(path.join(workspace, 'package.json'), 'utf8'));
    if (packageJson.scripts && packageJson.scripts.lint) {
        console.log('Running `npm run lint` (dry-run)...');
        // This might be too slow/noisy, so maybe just check if it exists for now.
        console.log('Lint script detected. (Skipped execution to save time/output size).');
    } else {
        console.log('No `lint` script found in package.json.');
    }
} catch (e) { }

console.log(`\n# INSTRUCTIONS for ${mode.toUpperCase()} REVIEW\n`);
if (mode === 'adversarial') {
    console.log(`You are a Red Team Reviewer. Find BUGS, SECURITY HOLES, and LOGIC ERRORS in the plan above.`);
    console.log(`1. output: Start with a list of CRITICAL issues.`);
    console.log(`2. output: Create a "Challenge Report" markdown artifact.`);
} else {
    console.log(`You are a Lead Developer. Verify the plan is sound and complete.`);
}
console.log(`\n(Context aggregation complete. Use this single output to generate your review.)`);
