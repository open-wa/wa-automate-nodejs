export interface LivePatchReleaseManifest {
  version: 1;
  hash: string;
  url: string;
  size: number;
  publishedAt: string;
  minCoreVersion?: string;
  maxCoreVersion?: string;
  signature: string;
}

export interface LivePatchAnalytics {
  schemaVersion: 1;
  hostHash?: string;
  waVersion?: string;
  coreVersion: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  driver: string;
  trigger: string;
  currentHash: string | null;
  result?: {
    updated: boolean;
    status: 'up_to_date' | 'updated' | 'rolled_back' | 'failed';
    oldHash: string | null;
    newHash: string | null;
    reloadDurationMs: number | null;
    totalDurationMs: number;
  };
}

const HASH = /^[a-f0-9]{64}$/i;
const HOST_HASH = /^[a-f0-9]{5}$/i;
const RESULT_STATUSES = new Set([
  'up_to_date',
  'updated',
  'rolled_back',
  'failed',
]);

function sanitizeResult(
  value: unknown,
): LivePatchAnalytics['result'] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const input = value as Record<string, unknown>;
  if (
    typeof input.updated !== 'boolean' ||
    typeof input.status !== 'string' ||
    !RESULT_STATUSES.has(input.status)
  ) {
    return undefined;
  }
  const oldHash =
    typeof input.oldHash === 'string' && HASH.test(input.oldHash)
      ? input.oldHash
      : null;
  const newHash =
    typeof input.newHash === 'string' && HASH.test(input.newHash)
      ? input.newHash
      : null;
  const reloadDurationMs =
    typeof input.reloadDurationMs === 'number' &&
    Number.isFinite(input.reloadDurationMs)
      ? Math.max(0, input.reloadDurationMs)
      : null;
  const totalDurationMs =
    typeof input.totalDurationMs === 'number' &&
    Number.isFinite(input.totalDurationMs)
      ? Math.max(0, input.totalDurationMs)
      : 0;
  return {
    updated: input.updated,
    status: input.status as LivePatchAnalytics['result']['status'],
    oldHash,
    newHash,
    reloadDurationMs,
    totalDurationMs,
  };
}

export function assertManifest(
  value: unknown,
): asserts value is LivePatchReleaseManifest {
  const manifest = value as Partial<LivePatchReleaseManifest> | null;
  if (!manifest || manifest.version !== 1 || !HASH.test(manifest.hash ?? '')) {
    throw new Error('Invalid live patch manifest');
  }
  if (
    !manifest.url?.startsWith('https://') ||
    !Number.isSafeInteger(manifest.size) ||
    Number(manifest.size) <= 0
  ) {
    throw new Error('Invalid live patch artifact');
  }
  if (
    !manifest.signature ||
    Number.isNaN(Date.parse(manifest.publishedAt ?? ''))
  ) {
    throw new Error('Invalid signed live patch metadata');
  }
}

export function sanitizeAnalytics(value: unknown): LivePatchAnalytics | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (input.schemaVersion !== 1 || typeof input.coreVersion !== 'string')
    return null;

  const result = sanitizeResult(input.result);
  return {
    schemaVersion: 1,
    ...(typeof input.hostHash === 'string' && HOST_HASH.test(input.hostHash)
      ? { hostHash: input.hostHash }
      : {}),
    ...(typeof input.waVersion === 'string'
      ? { waVersion: input.waVersion.slice(0, 40) }
      : {}),
    coreVersion: input.coreVersion.slice(0, 40),
    nodeVersion:
      typeof input.nodeVersion === 'string'
        ? input.nodeVersion.slice(0, 40)
        : 'unknown',
    platform:
      typeof input.platform === 'string'
        ? input.platform.slice(0, 24)
        : 'unknown',
    arch: typeof input.arch === 'string' ? input.arch.slice(0, 24) : 'unknown',
    driver:
      typeof input.driver === 'string' ? input.driver.slice(0, 24) : 'unknown',
    trigger:
      typeof input.trigger === 'string'
        ? input.trigger.slice(0, 24)
        : 'unknown',
    currentHash:
      typeof input.currentHash === 'string' && HASH.test(input.currentHash)
        ? input.currentHash
        : null,
    ...(result ? { result } : {}),
  };
}
