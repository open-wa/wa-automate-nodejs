import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = process.cwd();
const matrixPath = resolve(repoRoot, 'packages/core/test/fixtures/release-blocker-parity-matrix.json');
const manifestPath = resolve(repoRoot, '.sisyphus/evidence/task-20-evidence-manifest.json');
const summaryPath = resolve(repoRoot, '.sisyphus/evidence/task-20-release-suite.txt');
const humanManifestPath = resolve(repoRoot, '.sisyphus/evidence/task-20-evidence-manifest.txt');

const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const blockerIds = matrix.filter((item) => item.releaseBlocker).map((item) => item.id).sort();
const nonBlockerIds = matrix.filter((item) => !item.releaseBlocker).map((item) => item.id).sort();
const manifestBlockerIds = [...manifest.releaseBlockers.map((item) => item.id)].sort();
const manifestNonBlockerIds = [...manifest.acceptedNonBlockers.map((item) => item.id)].sort();

const missingBlockers = blockerIds.filter((id) => !manifestBlockerIds.includes(id));
const unexpectedBlockers = manifestBlockerIds.filter((id) => !blockerIds.includes(id));
const missingNonBlockers = nonBlockerIds.filter((id) => !manifestNonBlockerIds.includes(id));
const unexpectedNonBlockers = manifestNonBlockerIds.filter((id) => !nonBlockerIds.includes(id));
const unprovenBlockers = manifest.releaseBlockers
  .filter((item) => item.proofResult !== 'pass' || item.status !== 'proven')
  .map((item) => item.id);

const requiredFiles = [summaryPath, humanManifestPath, manifestPath];
const missingFiles = requiredFiles.filter((filePath) => !existsSync(filePath));

const report = {
  status:
    missingBlockers.length === 0 &&
    unexpectedBlockers.length === 0 &&
    missingNonBlockers.length === 0 &&
    unexpectedNonBlockers.length === 0 &&
    unprovenBlockers.length === 0 &&
    missingFiles.length === 0
      ? 'pass'
      : 'fail',
  blockerCount: blockerIds.length,
  acceptedNonBlockerCount: nonBlockerIds.length,
  missingBlockers,
  unexpectedBlockers,
  missingNonBlockers,
  unexpectedNonBlockers,
  unprovenBlockers,
  missingFiles,
  releaseDecision: manifest.releaseDecision?.status ?? 'unknown'
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

if (report.status !== 'pass') {
  process.exit(1);
}
