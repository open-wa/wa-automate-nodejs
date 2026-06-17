const { cpSync, existsSync, mkdirSync, rmSync } = require('fs');
const { resolve } = require('path');

const apiRoot = resolve(__dirname, '..');
const repoRoot = resolve(apiRoot, '../..');
const sourceDist = resolve(repoRoot, 'apps/dashboard-neo/dist');
const targetRoot = resolve(apiRoot, 'dashboard-neo');
const targetDist = resolve(targetRoot, 'dist');

if (!existsSync(resolve(sourceDist, 'index.html'))) {
  throw new Error(`Dashboard build output is missing: ${sourceDist}`);
}

rmSync(targetRoot, { recursive: true, force: true });
mkdirSync(targetRoot, { recursive: true });
cpSync(sourceDist, targetDist, { recursive: true });
console.log(`Copied dashboard assets to ${targetDist}`);
