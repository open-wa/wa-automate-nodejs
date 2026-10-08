import { createHash, createPublicKey, randomUUID, verify } from 'node:crypto';
import { Effect } from 'effect';

export interface RuntimeLicenseConfig {
  url?: string;
  /** Base64 SPKI pinned by the operator, never accepted from an HTTP response. */
  publicKey?: string;
  environment?: 'development' | 'production';
}
const protocol = 'openwa-runtime-v1';
const capabilities = ['messaging', 'stories', 'insiders', 'interactive'] as const;
type Capability = (typeof capabilities)[number];
const defaultUrl = 'https://api.openwa.cloud/api/license-runtime';
const defaultPublicKey = 'MCowBQYDK2VwAyEAR+oCSUbQO+uuZvhb/FuKR6GIrwBWyhxNhjmkoflNzvc=';
const leaseDurationMs = 300_000;
const artifactLimit = 2 * 1024 * 1024;
const hashPattern = /^[a-f0-9]{64}$/;

interface Artifact {
  id: Capability; capabilityId: Capability; sha256: string; bytes: number;
  phase: 'licensed'; required: true; dependencies: Capability[]; installedMethods: string[];
}
export interface VerifiedRuntimeGrant {
  protocol: typeof protocol; audience: 'openwa-sdk'; environment: 'development' | 'production';
  allocationId: string; grantId: string; credentialDigest: string; number: string; sessionId: string;
  nonce: string; issuedAt: number; expiresAt: number; entitlementExpiresAt: number;
  releaseId: string; capabilityIds: Capability[]; artifacts: Artifact[];
}
export interface PreparedRuntimeLicense {
  grant: VerifiedRuntimeGrant;
  payload: string;
  keyType: string;
  sessionId: string;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid signed runtime structure.');
  return value as Record<string, unknown>;
}
function text(value: unknown, limit = 100): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > limit) throw new Error('Invalid signed runtime field.');
  return value;
}
function integer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) throw new Error('Invalid signed runtime integer.');
  return value;
}
function hash(value: unknown): string {
  const result = text(value, 64);
  if (!hashPattern.test(result)) throw new Error('Invalid runtime content hash.');
  return result;
}
function capability(value: unknown): Capability {
  if (typeof value !== 'string' || !capabilities.some(id => id === value)) throw new Error('Unknown runtime capability.');
  return value as Capability;
}
function list(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error('Invalid signed runtime list.');
  return value;
}
function sha256(value: string | Uint8Array) { return createHash('sha256').update(value).digest('hex'); }
export function canonicalRuntimeNumber(value: string) {
  const match = /^\+?([1-9]\d{7,14})(?::\d+)?(?:@(?:c\.us|s\.whatsapp\.net))?$/.exec(value);
  if (!match) throw new Error('An exact international phone identity is required for an OpenWA license.');
  return match[1]!;
}
function configuration(config: RuntimeLicenseConfig) {
  const url = new URL(config.url ?? defaultUrl);
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) {
    throw new Error('The runtime license endpoint requires HTTPS or a local development address.');
  }
  const spki = Buffer.from(config.publicKey ?? defaultPublicKey, 'base64');
  const publicKey = createPublicKey({ key: spki, type: 'spki', format: 'der' });
  if (publicKey.asymmetricKeyType !== 'ed25519') throw new Error('The runtime trust key must be Ed25519.');
  return { url: url.href.replace(/\/$/, ''), publicKey,
    keyId: createHash('sha256').update(spki).digest('base64url'), environment: config.environment ?? 'production' };
}
async function fetchBounded(url: string, credential: string, body: object, limit: number): Promise<Buffer> {
  return Effect.runPromise(Effect.tryPromise({
    try: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch(url, { method: 'POST', redirect: 'error', signal: controller.signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${credential}` }, body: JSON.stringify(body) });
        if (!response.ok) throw new Error(`Runtime license request failed (HTTP ${response.status}).`);
        if (Number(response.headers.get('content-length')) > limit || !response.body) throw new Error('Runtime response exceeds its delivery bound.');
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
          for (;;) {
            const next = await reader.read();
            if (next.done) break;
            size += next.value.byteLength;
            if (size > limit) throw new Error('Runtime response exceeds its delivery bound.');
            chunks.push(next.value);
          }
        } finally { await reader.cancel(); reader.releaseLock(); }
        return Buffer.concat(chunks, size);
      } finally { clearTimeout(timeout); }
    },
    catch: error => error instanceof Error ? error : new Error('Runtime license request failed.'),
  }));
}

export async function authorizeRuntimeLicense(credential: string, sessionId: string, host: string, config: RuntimeLicenseConfig = {}) {
  if (!/^OWA_[A-F0-9]{8}(?:-[A-F0-9]{8}){3}$/.test(credential)) throw new Error('Invalid uppercase OpenWA runtime key format.');
  const trusted = configuration(config);
  const number = canonicalRuntimeNumber(host);
  const nonce = randomUUID();
  const response = object(JSON.parse((await fetchBounded(`${trusted.url}/authorize`, credential,
    { number, sessionId, nonce, sdkMajor: 5 }, 64 * 1024)).toString('utf8')));
  if (response.protocol !== protocol || response.algorithm !== 'Ed25519' || response.keyId !== trusted.keyId) {
    throw new Error('The runtime grant is not signed by the configured trust identity.');
  }
  const encoded = text(response.payload, 60 * 1024);
  const signature = text(response.signature, 100);
  if (!/^[A-Za-z0-9_-]+$/.test(encoded) || !/^[A-Za-z0-9_-]{86}$/.test(signature)) throw new Error('Invalid runtime signature encoding.');
  const payload = Buffer.from(encoded, 'base64url');
  if (!verify(null, payload, trusted.publicKey, Buffer.from(signature, 'base64url'))) throw new Error('Runtime grant signature verification failed.');
  const raw = object(JSON.parse(payload.toString('utf8')));
  if (raw.protocol !== protocol || raw.audience !== 'openwa-sdk' || raw.environment !== trusted.environment ||
      raw.number !== number || raw.sessionId !== sessionId || raw.nonce !== nonce || raw.credentialDigest !== sha256(credential)) {
    throw new Error('The runtime grant does not match this credential, host, session or request.');
  }
  const issuedAt = integer(raw.issuedAt), expiresAt = integer(raw.expiresAt), entitlementExpiresAt = integer(raw.entitlementExpiresAt);
  const now = Date.now();
  if (issuedAt > now + 30_000 || expiresAt <= now || expiresAt <= issuedAt ||
      expiresAt > issuedAt + leaseDurationMs || expiresAt > entitlementExpiresAt) throw new Error('The signed runtime lease is expired or invalid.');
  const granted = list(raw.capabilityIds, 4).map(capability);
  if (granted.length === 0 || new Set(granted).size !== granted.length) throw new Error('The signed grant has an invalid capability set.');
  const installed = new Set<Capability>();
  let previousOrder = -1;
  const artifacts = list(raw.artifacts, 4).map(value => {
    const entry = object(value);
    const id = capability(entry.id), capabilityId = capability(entry.capabilityId);
    const bytes = integer(entry.bytes);
    const dependencies = list(entry.dependencies, 4).map(capability);
    const installedMethods = list(entry.installedMethods, 32).map(value => text(value));
    const order = capabilities.indexOf(id);
    if (id !== capabilityId || !granted.includes(id) || installed.has(id) || entry.phase !== 'licensed' ||
        entry.required !== true || bytes <= 0 || bytes > artifactLimit || order <= previousOrder ||
        dependencies.some(dependency => !installed.has(dependency)) || !installedMethods.length ||
        installedMethods.some(method => !/^[A-Za-z_$][\w$]*$/.test(method))) throw new Error('The runtime artifact sequence is incomplete or invalid.');
    installed.add(id); previousOrder = order;
    return { id, capabilityId, sha256: hash(entry.sha256), bytes, phase: 'licensed' as const,
      required: true as const, dependencies, installedMethods };
  });
  if (granted.some(id => !installed.has(id))) throw new Error('A required runtime capability artifact is missing.');
  const grant: VerifiedRuntimeGrant = { protocol, audience: 'openwa-sdk', environment: trusted.environment,
    allocationId: text(raw.allocationId), grantId: text(raw.grantId), credentialDigest: sha256(credential),
    number, sessionId, nonce, issuedAt, expiresAt, entitlementExpiresAt, releaseId: hash(raw.releaseId), capabilityIds: granted, artifacts };
  return grant;
}

function browserLease(grant: VerifiedRuntimeGrant) {
  return { allocationId: grant.allocationId, grantId: grant.grantId, credentialDigest: grant.credentialDigest,
    number: grant.number, sessionId: grant.sessionId, releaseId: grant.releaseId,
    expiresAt: grant.expiresAt, capabilityIds: grant.capabilityIds };
}
export function runtimeKeyType(grant: VerifiedRuntimeGrant) {
  return grant.capabilityIds.includes('insiders') || grant.capabilityIds.includes('interactive') ? 'Insiders Program' : 'Restricted License Key';
}
export async function prepareRuntimeLicense(credential: string, sessionId: string, host: string, config: RuntimeLicenseConfig = {}): Promise<PreparedRuntimeLicense> {
  const grant = await authorizeRuntimeLicense(credential, sessionId, host, config);
  const trusted = configuration(config);
  const scripts = await Promise.all(grant.artifacts.map(async artifact => {
    const bytes = await fetchBounded(`${trusted.url}/artifacts/${artifact.sha256}`, credential,
      { number: grant.number, releaseId: grant.releaseId }, artifact.bytes);
    if (bytes.byteLength !== artifact.bytes || sha256(bytes) !== artifact.sha256) throw new Error(`Runtime artifact integrity failed: ${artifact.id}.`);
    return bytes.toString('utf8');
  }));
  const keyType = runtimeKeyType(grant);
  const methods = grant.artifacts.flatMap(artifact => artifact.installedMethods);
  const payload = `(function(){
    let lease = ${JSON.stringify(browserLease(grant))};
    const api = window.WAPI;
    if (!api || window.__owaUpdateLicense) return false;
    const subject = () => {
      const identity = window.Store?.Conn?.me?._serialized || (typeof window.moi === 'function' ? window.moi() : '');
      return /^([1-9]\\d{7,14})(?::\\d+)?(?:@(?:c\\.us|s\\.whatsapp\\.net))?$/.exec(String(identity))?.[1];
    };
    const allowed = () => lease.expiresAt > Date.now() && subject() === lease.number;
    const before = Object.getOwnPropertyDescriptors(api);
    try {
      if (!allowed()) throw new Error('The licensed host or lease is unavailable.');
      ${scripts.join('\n;\n')}
      if (!${JSON.stringify(methods)}.every(name => typeof api[name] === 'function' && before[name]?.value !== api[name])) throw new Error('A required licensed method was not installed.');
      for (const name of Object.getOwnPropertyNames(api)) {
        const implementation = api[name];
        if (typeof implementation !== 'function' || before[name]?.value === implementation) continue;
        api[name] = function(...args) {
          if (!allowed()) throw new Error('OpenWA runtime authorization expired or the host changed.');
          const scoped = args.map(argument => typeof argument === 'function' ? function(...event) {
            if (allowed()) return Reflect.apply(argument, this, event);
          } : argument);
          return Reflect.apply(implementation, this, scoped);
        };
      }
      Object.defineProperty(window, '__owaUpdateLicense', { configurable: true, value: next => {
        if (!next) { lease = {...lease, expiresAt: 0}; window.KEYTYPE = false; return true; }
        const fields = ['allocationId','grantId','credentialDigest','number','sessionId','releaseId'];
        if (fields.some(field => lease[field] !== next[field]) || JSON.stringify(lease.capabilityIds) !== JSON.stringify(next.capabilityIds)) {
          lease = {...lease, expiresAt: 0}; window.KEYTYPE = false; return false;
        }
        lease = next;
        if (!allowed()) { window.KEYTYPE = false; return false; }
        window.KEYTYPE = ${JSON.stringify(keyType)};
        return true;
      }});
      Object.defineProperty(window, '__owaLicenseState', { configurable: true, get: () => ({...lease, authorized: allowed()}) });
      window.KEYTYPE = ${JSON.stringify(keyType)};
      window.notified = true;
      return true;
    } catch (error) {
      for (const name of Object.getOwnPropertyNames(api)) {
        if (before[name]) Object.defineProperty(api, name, before[name]); else delete api[name];
      }
      window.KEYTYPE = false;
      window.launchError = error instanceof Error ? error.message : 'Licensed artifact installation failed.';
      return false;
    }
  })()`;
  return { grant, payload, keyType, sessionId };
}
export function runtimeRenewalPayload(grant: VerifiedRuntimeGrant | null) {
  return `typeof window.__owaUpdateLicense === 'function' && window.__owaUpdateLicense(${grant ? JSON.stringify(browserLease(grant)) : 'null'})`;
}
