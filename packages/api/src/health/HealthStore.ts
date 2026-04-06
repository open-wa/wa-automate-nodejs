/**
 * HealthStore
 *
 * Lightweight in-memory accumulator for system health data.
 * Captures launch timeline, patches, license info, and reconnection events
 * from the core event emitter. Exposed via the `/health` REST endpoint
 * so the dashboard can poll it without maintaining a persistent socket subscription.
 *
 * Memory-efficient: uses bounded arrays (max 100 reconnections) and
 * only stores small summaries — no message payloads.
 */

const MAX_RECONNECTIONS = 100;
const MAX_TIMELINE_STEPS = 50;

export interface TimelineStep {
  step: string;
  status: 'done' | 'failed';
  durationMs: number;
  details?: Record<string, unknown>;
  timestamp: number;
}

export interface PatchInfo {
  patchId: string;
  description: string;
  required: boolean;
  outcome: 'applied' | 'not_applicable' | 'failed';
}

export interface LicenseInfo {
  status: 'valid' | 'metadata_only' | 'missing' | 'invalid' | 'expired';
  source: string;
  keyType: string;
  detail: string;
}

export interface ReconnectionEntry {
  timestamp: number;
  reason: string;
  downtimeMs: number;
  success: boolean;
}

export interface HealthSnapshot {
  launchTimeline: TimelineStep[];
  patches: PatchInfo[];
  license: LicenseInfo | null;
  reconnections: ReconnectionEntry[];
  startedAt: number | null;
  lastEventAt: number | null;
}

export class HealthStore {
  private timeline: TimelineStep[] = [];
  private patches: PatchInfo[] = [];
  private license: LicenseInfo | null = null;
  private reconnections: ReconnectionEntry[] = [];
  private startedAt: number | null = null;
  private lastEventAt: number | null = null;

  // Step start times for computing durations
  private stepStarts: Map<string, number> = new Map();

  /**
   * Process an event from the core emitter.
   * Call this from the onAny bridge with the event name and payload.
   */
  processEvent(event: string, payload: unknown) {
    const data = payload as Record<string, unknown> | undefined;
    const ts = Date.now();
    this.lastEventAt = ts;

    // ── Launch timeline ──
    if (event.startsWith('launch.') && event.endsWith('.before')) {
      const step = event.replace('.before', '');
      this.stepStarts.set(step, ts);
      return;
    }

    if (event.startsWith('launch.') && event.endsWith('.after')) {
      const step = event.replace('.after', '');
      const startTime = this.stepStarts.get(step);
      const durationMs = startTime ? ts - startTime : 0;
      this.stepStarts.delete(step);

      const details = data as Record<string, unknown> | undefined;
      const hasFailed = details?.success === false || details?.blockingFailure === true;

      this.addTimelineStep({
        step,
        status: hasFailed ? 'failed' : 'done',
        durationMs: (details?.durationMs as number) || durationMs,
        details: details ? this.sanitizeDetails(details) : undefined,
        timestamp: ts,
      });

      // Special: capture patch info from launch.patch.init.after
      if (step === 'launch.patch.init') {
        this.capturePatchInfo(details);
      }

      // Special: capture license info from launch.license.preload.after or launch.license.check.after
      if (step === 'launch.license.preload' || step === 'launch.license.check') {
        this.captureLicenseInfo(details);
      }
      return;
    }

    // ── Direct step events (without .before/.after pattern) ──
    if (event === 'launch.create.start') {
      this.startedAt = ts;
      this.addTimelineStep({
        step: event,
        status: 'done',
        durationMs: 0,
        details: data ? this.sanitizeDetails(data) : undefined,
        timestamp: ts,
      });
      return;
    }

    if (event === 'launch.create.ready') {
      this.addTimelineStep({
        step: event,
        status: 'done',
        durationMs: 0,
        details: data ? this.sanitizeDetails(data) : undefined,
        timestamp: ts,
      });
      return;
    }

    // ── Reconnection tracking ──
    if (event === 'session.connection.disconnected') {
      // We'll start tracking a disconnect; only add if we later get a reconnect
      this.reconnections.push({
        timestamp: Math.floor(ts / 1000),
        reason: (data?.reason as string) || 'unknown',
        downtimeMs: 0,
        success: false,
      });
      if (this.reconnections.length > MAX_RECONNECTIONS) {
        this.reconnections.shift();
      }
      return;
    }

    if (event === 'session.connection.reconnected') {
      // Find the last disconnect and mark it as successful
      const last = this.reconnections[this.reconnections.length - 1];
      if (last && !last.success) {
        last.success = true;
        last.downtimeMs = (data?.downtimeMs as number) || 0;
      } else {
        this.reconnections.push({
          timestamp: Math.floor(ts / 1000),
          reason: 'reconnected',
          downtimeMs: (data?.downtimeMs as number) || 0,
          success: true,
        });
        if (this.reconnections.length > MAX_RECONNECTIONS) {
          this.reconnections.shift();
        }
      }
      return;
    }

    // ── Session state changes ──
    if (event === 'session.state.changed') {
      this.addTimelineStep({
        step: event,
        status: 'done',
        durationMs: 0,
        details: data ? this.sanitizeDetails(data) : undefined,
        timestamp: ts,
      });
    }
  }

  /**
   * Get a snapshot of all accumulated health data.
   * This is what gets returned by the /health endpoint.
   */
  getSnapshot(): HealthSnapshot {
    return {
      launchTimeline: [...this.timeline],
      patches: [...this.patches],
      license: this.license ? { ...this.license } : null,
      reconnections: [...this.reconnections],
      startedAt: this.startedAt,
      lastEventAt: this.lastEventAt,
    };
  }

  private addTimelineStep(step: TimelineStep) {
    this.timeline.push(step);
    if (this.timeline.length > MAX_TIMELINE_STEPS) {
      this.timeline.shift();
    }
  }

  private capturePatchInfo(details?: Record<string, unknown>) {
    if (!details) return;
    const applied = (details.applied as string[]) || [];
    const available = (details.available as string[]) || applied;
    const outcome = details.outcome as string;

    this.patches = available.map((id) => ({
      patchId: id,
      description: `Patch ${id}`,
      required: true,
      outcome: applied.includes(id) ? 'applied' as const : (outcome === 'none' ? 'not_applicable' as const : 'failed' as const),
    }));
  }

  private captureLicenseInfo(details?: Record<string, unknown>) {
    if (!details) return;
    this.license = {
      status: (details.status as LicenseInfo['status']) || 'missing',
      source: (details.source as string) || 'unknown',
      keyType: (details.payloadSource as string) || 'unknown',
      detail: (details.detail as string) || `License ${details.status || 'check complete'}`,
    };
  }

  /** Remove large/noisy fields from details to keep memory lean */
  private sanitizeDetails(data: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data)) {
      // Skip internal fields
      if (key === 'correlationId' || key === 'ts' || key === 'step') continue;
      // Skip large arrays/objects
      if (Array.isArray(val) && val.length > 10) {
        clean[key] = `[${val.length} items]`;
        continue;
      }
      clean[key] = val;
    }
    return clean;
  }
}
