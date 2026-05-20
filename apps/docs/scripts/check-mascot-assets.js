import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..');

const requiredMascots = [
  ['/', 'wally-homepage-session-console.png'],
  ['/docs', 'wally-docs-map.png'],
  ['/docs/getting-started/quickstart', 'wally-quickstart-rocket.png'],
  ['/docs/getting-started/link-code', 'wally-link-code-phone.png'],
  ['/docs/getting-started/easy-api', 'wally-easy-api-counter.png'],
  ['/docs/getting-started/custom-code', 'wally-custom-code-workbench.png'],
  ['/docs/getting-started/docker', 'wally-docker-container.png'],
  ['/docs/getting-started/v5-alpha', 'wally-alpha-lab.png'],
  ['/docs/concepts/how-it-works', 'wally-runtime-diagram.png'],
  ['/docs/concepts/data-models', 'wally-data-models.png'],
  ['/docs/concepts/packages', 'wally-package-shelves.png'],
  ['/docs/concepts/glossary', 'wally-glossary-book.png'],
  ['/docs/guides/integrations-overview', 'wally-integration-hub.png'],
  ['/docs/guides/chatid-primer', 'wally-chatid-name-tags.png'],
  ['/docs/guides/authentication-flow', 'wally-auth-checkpoint.png'],
  ['/docs/guides/messages', 'wally-message-bubbles.png'],
  ['/docs/guides/media', 'wally-media-camera.png'],
  ['/docs/guides/groups', 'wally-group-circle.png'],
  ['/docs/guides/group-filtering', 'wally-filter-sieve.png'],
  ['/docs/guides/message-deletion', 'wally-message-eraser.png'],
  ['/docs/guides/session-events', 'wally-event-bell.png'],
  ['/docs/guides/multiple-sessions', 'wally-session-switchboard.png'],
  ['/docs/guides/webhooks-for-business', 'wally-webhook-fishing.png'],
  ['/docs/guides/node-red', 'wally-node-flow.png'],
  ['/docs/guides/s3-media', 'wally-cloud-storage.png'],
  ['/docs/guides/mcp', 'wally-mcp-tools.png'],
  ['/docs/guides/ai-agent-patterns', 'wally-agent-orchestrator.png'],
  ['/docs/guides/configuration-and-cli', 'wally-cli-control-panel.png'],
  ['/docs/guides/config-schema', 'wally-schema-blueprint.png'],
  ['/docs/guides/config-secrets', 'wally-secrets-vault.png'],
  ['/docs/guides/rate-limits', 'wally-rate-limit-traffic.png'],
];

const pngSignature = '89504e470d0a1a0a';
const mascotDir = path.join(docsRoot, 'public/mascots');
const homepage = fs.readFileSync(path.join(docsRoot, 'src/components/homepage.tsx'), 'utf8');
const callout = fs.readFileSync(path.join(docsRoot, 'src/components/mascot-callout.tsx'), 'utf8');
const route = fs.readFileSync(path.join(docsRoot, 'src/routes/docs/$.tsx'), 'utf8');
const failures = [];

for (const [, filename] of requiredMascots) {
  const filePath = path.join(mascotDir, filename);
  if (!fs.existsSync(filePath)) {
    failures.push('Missing mascot file: ' + filename);
    continue;
  }

  const file = fs.readFileSync(filePath);
  if (file.subarray(0, 8).toString('hex') !== pngSignature) {
    failures.push('Not a PNG: ' + filename);
    continue;
  }

  const width = file.readUInt32BE(16);
  const height = file.readUInt32BE(20);
  if (width !== 1024 || height !== 1024) {
    failures.push('Expected 1024x1024 PNG for ' + filename + ', got ' + width + 'x' + height);
  }
}

if (!homepage.includes('/mascots/wally-homepage-session-console.png')) {
  failures.push('Homepage hero does not reference /mascots/wally-homepage-session-console.png');
}

if (homepage.includes('src="/wally-typing.png"')) {
  failures.push('Homepage hero still references /wally-typing.png');
}

for (const [pagePath, filename] of requiredMascots.slice(1)) {
  if (!callout.includes("'" + pagePath + "'")) {
    failures.push('Mascot callout missing route mapping: ' + pagePath);
  }
  if (!callout.includes('/mascots/' + filename)) {
    failures.push('Mascot callout missing asset mapping: ' + filename);
  }
}

if (!route.includes('<MascotCallout onlyMapped className="mb-8" />')) {
  failures.push('Docs content route does not render mapped page mascots');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Validated ' + requiredMascots.length + ' Wally mascot PNGs and docs references.');
