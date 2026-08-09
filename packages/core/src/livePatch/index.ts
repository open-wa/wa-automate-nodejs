import { createHash, verify } from 'node:crypto';
import { CronExpressionParser } from 'cron-parser';

export type LivePatchTrigger =
  | 'socket'
  | 'poll'
  | 'cron'
  | 'keyboard'
  | 'client'
  | 'api';
export type LivePatchUpdateStatus =
  | 'up_to_date'
  | 'updated'
  | 'rolled_back'
  | 'failed';

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

export interface LivePatchUpdateResult {
  updated: boolean;
  status: LivePatchUpdateStatus;
  oldHash: string | null;
  newHash: string | null;
  reloadDurationMs: number | null;
  totalDurationMs: number;
}

export type PollPatchSchedule =
  | { kind: 'interval'; minutes: number }
  | { kind: 'cron'; expression: string };

export interface LivePatchRuntimeConfig {
  livePatch?: boolean;
  pollPatch?: false | boolean | number | string;
  endpoint: string;
  publicKey?: string;
  idleMs?: number;
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
  trigger: LivePatchTrigger;
  currentHash: string | null;
}

export interface CreateLivePatchAnalyticsInput {
  hostNumber?: string;
  waVersion?: string;
  coreVersion: string;
  driver: string;
  trigger: LivePatchTrigger;
  currentHash: string | null;
}

const SHA_256_PATTERN = /^[a-f0-9]{64}$/i;
const MIN_POLL_MINUTES = 5;

export function sha256Hex(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeHostNumber(hostNumber: string): string {
  return hostNumber
    .trim()
    .toLowerCase()
    .replace(/@(?:c|s)\.us$/, '');
}

export function createLivePatchAnalytics(
  input: CreateLivePatchAnalyticsInput,
): LivePatchAnalytics {
  const normalizedHost = input.hostNumber
    ? normalizeHostNumber(input.hostNumber)
    : '';

  return {
    schemaVersion: 1,
    ...(normalizedHost
      ? { hostHash: sha256Hex(normalizedHost).slice(0, 5) }
      : {}),
    ...(input.waVersion ? { waVersion: input.waVersion } : {}),
    coreVersion: input.coreVersion,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    driver: input.driver,
    trigger: input.trigger,
    currentHash: input.currentHash,
  };
}

export function canonicalizeLivePatchManifest(
  manifest: LivePatchReleaseManifest,
): string {
  return JSON.stringify({
    version: manifest.version,
    hash: manifest.hash,
    url: manifest.url,
    size: manifest.size,
    publishedAt: manifest.publishedAt,
    ...(manifest.minCoreVersion
      ? { minCoreVersion: manifest.minCoreVersion }
      : {}),
    ...(manifest.maxCoreVersion
      ? { maxCoreVersion: manifest.maxCoreVersion }
      : {}),
  });
}

export function assertLivePatchManifest(
  value: unknown,
): asserts value is LivePatchReleaseManifest {
  if (!value || typeof value !== 'object') {
    throw new Error('Live patch manifest must be an object');
  }

  const manifest = value as Partial<LivePatchReleaseManifest>;
  if (manifest.version !== 1)
    throw new Error('Unsupported live patch manifest version');
  if (
    typeof manifest.hash !== 'string' ||
    !SHA_256_PATTERN.test(manifest.hash)
  ) {
    throw new Error('Live patch manifest hash must be a full SHA-256');
  }
  if (
    typeof manifest.url !== 'string' ||
    !manifest.url.startsWith('https://')
  ) {
    throw new Error('Live patch manifest URL must use HTTPS');
  }
  if (!Number.isSafeInteger(manifest.size) || Number(manifest.size) <= 0) {
    throw new Error('Live patch manifest size must be a positive integer');
  }
  if (
    typeof manifest.publishedAt !== 'string' ||
    Number.isNaN(Date.parse(manifest.publishedAt))
  ) {
    throw new Error('Live patch manifest publishedAt must be an ISO timestamp');
  }
  if (
    typeof manifest.signature !== 'string' ||
    manifest.signature.length === 0
  ) {
    throw new Error('Live patch manifest signature is required');
  }
}

export function verifyLivePatchManifest(
  manifest: LivePatchReleaseManifest,
  publicKeyPem: string,
): void {
  assertLivePatchManifest(manifest);
  const valid = verify(
    null,
    Buffer.from(canonicalizeLivePatchManifest(manifest)),
    publicKeyPem,
    Buffer.from(manifest.signature, 'base64'),
  );

  if (!valid) {
    throw new Error('Live patch manifest signature verification failed');
  }
}

function assertCronMinimum(expression: string): void {
  let interval;
  try {
    interval = CronExpressionParser.parse(expression, {
      currentDate: new Date('2026-01-01T00:00:00.000Z'),
      tz: 'UTC',
    });
  } catch (error) {
    throw new Error(
      `Invalid poll patch cron expression: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  let previous = interval.next().toDate().getTime();
  for (let index = 0; index < 512; index += 1) {
    const next = interval.next().toDate().getTime();
    if (next - previous < MIN_POLL_MINUTES * 60_000) {
      throw new Error(
        'Poll patch cron occurrences must be at least 5 minutes apart',
      );
    }
    previous = next;
  }
}

export function normalizePollPatchSchedule(
  value: boolean | number | string,
): PollPatchSchedule {
  if (value === false) {
    throw new Error('Poll patch schedule cannot be normalized from false');
  }

  if (value === true) {
    return { kind: 'interval', minutes: MIN_POLL_MINUTES };
  }

  if (typeof value === 'number' || /^\d+(?:\.\d+)?$/.test(value.trim())) {
    const minutes = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(minutes) || minutes < MIN_POLL_MINUTES) {
      throw new Error('Poll patch interval must be at least 5 minutes');
    }
    return { kind: 'interval', minutes };
  }

  const expression = value.trim();
  assertCronMinimum(expression);
  return { kind: 'cron', expression };
}

export class LivePatchUpdatingError extends Error {
  constructor() {
    super(
      'Client operation rejected because a live patch update is in progress',
    );
    this.name = 'LivePatchUpdatingError';
  }
}

export class LivePatchActivityGate {
  private readonly idleMs: number;
  private lastActivityAt = Date.now();
  private activeOperations = 0;
  private frozen = false;
  private drainWaiters = new Set<() => void>();

  constructor(idleMs = 10_000) {
    this.idleMs = idleMs;
  }

  isFrozen(): boolean {
    return this.frozen;
  }

  noteActivity(): void {
    if (!this.frozen) {
      this.lastActivityAt = Date.now();
    }
  }

  runOperation<T>(operation: () => Promise<T>): Promise<T> {
    if (this.frozen) {
      throw new LivePatchUpdatingError();
    }

    this.activeOperations += 1;
    this.noteActivity();

    return operation().finally(() => {
      this.activeOperations = Math.max(0, this.activeOperations - 1);
      this.noteActivity();
      if (this.activeOperations === 0) {
        for (const resolve of this.drainWaiters) resolve();
        this.drainWaiters.clear();
      }
    });
  }

  async quiesce(waitForIdle: boolean): Promise<void> {
    if (waitForIdle) {
      while (true) {
        const remaining = this.idleMs - (Date.now() - this.lastActivityAt);
        if (remaining <= 0) break;
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
    }

    this.frozen = true;
    if (this.activeOperations > 0) {
      await new Promise<void>((resolve) => this.drainWaiters.add(resolve));
    }
  }

  resume(): void {
    this.frozen = false;
    this.lastActivityAt = Date.now();
  }
}

export interface LivePatchApplyOutcome {
  activeHash: string | null;
  reloadDurationMs: number;
  rolledBack: boolean;
}

export interface LivePatchCoordinatorOptions {
  gate: LivePatchActivityGate;
  getCurrentHash: () => string | null;
  check: (
    trigger: LivePatchTrigger,
    currentHash: string | null,
  ) => Promise<LivePatchReleaseManifest | null>;
  beforeApply?: () => Promise<void>;
  apply: (manifest: LivePatchReleaseManifest) => Promise<LivePatchApplyOutcome>;
  report?: (
    trigger: LivePatchTrigger,
    result: LivePatchUpdateResult,
  ) => Promise<void>;
}

export class LivePatchCoordinator {
  private readonly options: LivePatchCoordinatorOptions;
  private currentUpdate: Promise<LivePatchUpdateResult> | null = null;

  constructor(options: LivePatchCoordinatorOptions) {
    this.options = options;
  }

  update(trigger: LivePatchTrigger): Promise<LivePatchUpdateResult> {
    if (this.currentUpdate) {
      return this.currentUpdate;
    }

    this.currentUpdate = this.runUpdate(trigger).finally(() => {
      this.currentUpdate = null;
    });
    return this.currentUpdate;
  }

  private async runUpdate(
    trigger: LivePatchTrigger,
  ): Promise<LivePatchUpdateResult> {
    const startedAt = Date.now();
    const oldHash = this.options.getCurrentHash();
    let result: LivePatchUpdateResult;

    try {
      const manifest = await this.options.check(trigger, oldHash);
      if (!manifest || manifest.hash === oldHash) {
        result = {
          updated: false,
          status: 'up_to_date',
          oldHash,
          newHash: oldHash,
          reloadDurationMs: null,
          totalDurationMs: Date.now() - startedAt,
        };
      } else {
        const automatic =
          trigger === 'socket' || trigger === 'poll' || trigger === 'cron';
        await this.options.gate.quiesce(automatic);
        await this.options.beforeApply?.();
        const outcome = await this.options.apply(manifest);
        result = {
          updated: !outcome.rolledBack && outcome.activeHash === manifest.hash,
          status: outcome.rolledBack ? 'rolled_back' : 'updated',
          oldHash,
          newHash: outcome.activeHash,
          reloadDurationMs: outcome.reloadDurationMs,
          totalDurationMs: Date.now() - startedAt,
        };
      }
    } catch {
      result = {
        updated: false,
        status: 'failed',
        oldHash,
        newHash: this.options.getCurrentHash(),
        reloadDurationMs: null,
        totalDurationMs: Date.now() - startedAt,
      };
    } finally {
      this.options.gate.resume();
    }

    if (this.options.report) {
      await this.options.report(trigger, result).catch(() => undefined);
    }
    return result;
  }
}

export interface LivePatchControlClientOptions {
  endpoint: string;
  publicKey: string;
  fetch?: typeof fetch;
  verifyManifest?: (
    manifest: LivePatchReleaseManifest,
    publicKey: string,
  ) => void;
}

interface LivePatchCheckResponse {
  updated: boolean;
  manifest?: unknown;
}

export class LivePatchControlClient {
  private readonly endpoint: string;
  private readonly publicKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly verifyManifest: (
    manifest: LivePatchReleaseManifest,
    publicKey: string,
  ) => void;

  constructor(options: LivePatchControlClientOptions) {
    this.endpoint = options.endpoint.replace(/\/+$/, '');
    this.publicKey = options.publicKey;
    this.fetchImpl = options.fetch ?? fetch;
    this.verifyManifest = options.verifyManifest ?? verifyLivePatchManifest;
  }

  async check(
    analytics: LivePatchAnalytics,
  ): Promise<LivePatchReleaseManifest | null> {
    const response = await this.fetchImpl(`${this.endpoint}/patches/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analytics),
    });

    if (response.status === 204) return null;
    if (!response.ok) {
      throw new Error(`Live patch check failed with HTTP ${response.status}`);
    }

    const body = (await response.json()) as LivePatchCheckResponse;
    if (!body.updated) return null;
    assertLivePatchManifest(body.manifest);
    this.verifyManifest(body.manifest, this.publicKey);
    return body.manifest;
  }

  async download(manifest: LivePatchReleaseManifest): Promise<string[]> {
    const response = await this.fetchImpl(manifest.url, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(
        `Live patch download failed with HTTP ${response.status}`,
      );
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength !== manifest.size) {
      throw new Error(
        `Live patch bundle size mismatch: expected ${manifest.size}, received ${bytes.byteLength}`,
      );
    }
    if (sha256Hex(bytes) !== manifest.hash) {
      throw new Error('Live patch bundle SHA-256 verification failed');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(new TextDecoder().decode(bytes));
    } catch (error) {
      throw new Error(
        `Live patch bundle is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (
      !Array.isArray(parsed) ||
      !parsed.every((entry) => typeof entry === 'string')
    ) {
      throw new Error('Live patch bundle must be a JSON array of scripts');
    }
    return parsed;
  }

  async report(
    analytics: LivePatchAnalytics,
    result: LivePatchUpdateResult,
  ): Promise<void> {
    const response = await this.fetchImpl(`${this.endpoint}/patches/outcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...analytics, result }),
    });
    if (!response.ok) {
      throw new Error(
        `Live patch outcome report failed with HTTP ${response.status}`,
      );
    }
  }
}

interface WebSocketLike {
  close(): void;
  addEventListener(
    type: string,
    listener: (event: { data?: unknown }) => void,
  ): void;
}

interface WebSocketConstructorLike {
  new (url: string): WebSocketLike;
}

export interface LivePatchAutomationOptions {
  config: LivePatchRuntimeConfig;
  update: (trigger: LivePatchTrigger) => Promise<LivePatchUpdateResult>;
  WebSocket?: WebSocketConstructorLike;
  onError?: (error: unknown) => void;
}

export class LivePatchAutomation {
  private readonly options: LivePatchAutomationOptions;
  private stopped = true;
  private timer?: ReturnType<typeof setTimeout>;
  private socket?: WebSocketLike;
  private reconnectAttempt = 0;

  constructor(options: LivePatchAutomationOptions) {
    if (options.config.livePatch && options.config.pollPatch) {
      throw new Error('livePatch and pollPatch modes are mutually exclusive');
    }
    this.options = options;
  }

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    if (this.options.config.livePatch) {
      this.connectSocket();
      return;
    }
    if (this.options.config.pollPatch) {
      this.schedulePoll(
        normalizePollPatchSchedule(this.options.config.pollPatch),
      );
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.socket?.close();
    this.socket = undefined;
  }

  private connectSocket(): void {
    if (this.stopped) return;
    const WebSocketCtor =
      this.options.WebSocket ??
      (
        globalThis as typeof globalThis & {
          WebSocket?: WebSocketConstructorLike;
        }
      ).WebSocket;
    if (!WebSocketCtor) {
      this.options.onError?.(
        new Error('WebSocket is unavailable in this Node.js runtime'),
      );
      return;
    }

    const socketUrl = `${this.options.config.endpoint.replace(/^http/, 'ws').replace(/\/+$/, '')}/patches/stream`;
    const socket = new WebSocketCtor(socketUrl);
    this.socket = socket;
    socket.addEventListener('open', () => {
      this.reconnectAttempt = 0;
      void this.options.update('socket');
    });
    socket.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      try {
        const message = JSON.parse(event.data) as { type?: string };
        if (message.type === 'patch.available')
          void this.options.update('socket');
      } catch {
        // Ignore malformed control-plane messages; the next valid release/check recovers.
      }
    });
    socket.addEventListener('error', (event) => this.options.onError?.(event));
    socket.addEventListener('close', () => {
      if (this.stopped) return;
      this.socket = undefined;
      const base = Math.min(30_000, 1_000 * 2 ** this.reconnectAttempt++);
      const delay = Math.round(base * (0.75 + Math.random() * 0.5));
      this.timer = setTimeout(() => this.connectSocket(), delay);
      this.timer.unref?.();
    });
  }

  private schedulePoll(schedule: PollPatchSchedule): void {
    if (this.stopped) return;
    const now = new Date();
    const delay =
      schedule.kind === 'interval'
        ? schedule.minutes * 60_000
        : CronExpressionParser.parse(schedule.expression, { currentDate: now })
            .next()
            .toDate()
            .getTime() - now.getTime();
    this.timer = setTimeout(async () => {
      try {
        await this.options.update(schedule.kind === 'cron' ? 'cron' : 'poll');
      } catch (error) {
        this.options.onError?.(error);
      } finally {
        this.schedulePoll(schedule);
      }
    }, delay);
    this.timer.unref?.();
  }
}
