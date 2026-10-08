/** Adapted from the existing live-patch activity gate; no mutation is replayed. */
export class SessionRefreshingError extends Error {
  readonly code = 'SESSION_REFRESHING';
  readonly status = 503;
  constructor() { super('The session is refreshing. Retry when it is ready.'); this.name = 'SessionRefreshingError'; }
}

export class LivePatchActivityGate {
  private frozen = false;
  private active = 0;
  private waiters = new Set<() => void>();
  isFrozen(): boolean { return this.frozen; }
  async runOperation<T>(operation: () => Promise<T>): Promise<T> {
    if (this.frozen) throw new SessionRefreshingError();
    this.active++;
    try { return await operation(); }
    finally { if (--this.active === 0) { for (const done of this.waiters) done(); this.waiters.clear(); } }
  }
  async quiesce(timeoutMs = 15_000): Promise<void> {
    this.frozen = true;
    if (!this.active) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let done: () => void = () => undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        done = resolve; this.waiters.add(done);
        timer = setTimeout(() => reject(new Error('SESSION_REFRESH_DRAIN_TIMEOUT')), timeoutMs);
      });
    } finally { clearTimeout(timer); this.waiters.delete(done); }
  }
  resume(): void { this.frozen = false; }
}
