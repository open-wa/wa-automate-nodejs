#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
    const args = {
        workspace: process.cwd(),
        outDir: '.switchboard/specs',
        files: [],
        requireAll: false
    };

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--workspace' && argv[i + 1]) {
            args.workspace = path.resolve(argv[++i]);
            continue;
        }
        if (a === '--out' && argv[i + 1]) {
            args.outDir = argv[++i];
            continue;
        }
        if (a === '--files' && argv[i + 1]) {
            args.files = argv[++i]
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
            continue;
        }
        if (a === '--require-all') {
            args.requireAll = true;
            continue;
        }
    }

    return args;
}

function copySafe(src, dst) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
}

const args = parseArgs(process.argv.slice(2));
if (args.files.length === 0) {
    console.error('Usage: node .agent/scripts/stage-artifacts.js --files <a,b,c> [--out .switchboard/specs] [--workspace <path>] [--require-all]');
    process.exit(1);
}

const workspaceRoot = args.workspace;
const outRoot = path.resolve(workspaceRoot, args.outDir);
fs.mkdirSync(outRoot, { recursive: true });

const copied = [];
const missing = [];

for (const rel of args.files) {
    const src = path.resolve(workspaceRoot, rel);
    const name = path.basename(rel);
    const dst = path.join(outRoot, name);

    if (!fs.existsSync(src)) {
        missing.push(rel);
        continue;
    }

    copySafe(src, dst);
    copied.push({
        source: rel,
        target: path.relative(workspaceRoot, dst).replace(/\\/g, '/')
    });
}

if (args.requireAll && missing.length > 0) {
    console.error(`[Stage] Missing required artifacts: ${missing.join(', ')}`);
    process.exit(2);
}

const manifest = {
    outDir: path.relative(workspaceRoot, outRoot).replace(/\\/g, '/'),
    copied,
    missing,
    timestamp: new Date().toISOString()
};

const manifestPath = path.join(outRoot, `staging_manifest_${Date.now()}.json`);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log(JSON.stringify({
    ok: true,
    manifest: path.relative(workspaceRoot, manifestPath).replace(/\\/g, '/'),
    copied: copied.length,
    missing: missing.length
}, null, 2));

