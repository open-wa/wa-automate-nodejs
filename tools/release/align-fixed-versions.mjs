import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { packages, command } from './shared.mjs';

// A newly added fixed-group member can enter Bumpy with a lower starting version.
// Normalize that member to the group's highest stable version after versioning.
const config = JSON.parse(readFileSync('.bumpy/_config.json', 'utf8'));
const publicPackages = packages();
let changed = false;
for (const names of config.fixed || []) {
  const members = publicPackages.filter(pkg => names.includes(pkg.name));
  const stable = members.filter(pkg => /^\d+\.\d+\.\d+$/.test(pkg.version));
  if (stable.length !== members.length || !stable.length) continue;
  const compare = (a, b) => {
    const left = a.version.split('.').map(Number), right = b.version.split('.').map(Number);
    for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] - right[i];
    return 0;
  };
  const target = stable.sort(compare).at(-1).version;
  for (const pkg of members) {
    if (pkg.version === target) continue;
    const path = `${pkg.directory}/package.json`;
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    manifest.version = target;
    writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
    const changelog = `${pkg.directory}/CHANGELOG.md`;
    if (existsSync(changelog)) {
      const notes = readFileSync(changelog, 'utf8');
      writeFileSync(changelog, notes.replace(`## ${pkg.version}\n`, `## ${target}\n`));
    }
    console.log(`Align ${pkg.name}: ${pkg.version} → ${target}`);
    changed = true;
  }
}
if (changed) command('pnpm', ['install', '--lockfile-only', '--ignore-scripts'], { stdio: 'inherit' });
