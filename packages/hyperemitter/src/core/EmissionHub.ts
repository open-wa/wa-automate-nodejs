import { Effect, PubSub } from 'effect';

/** Synchronous emit supports non-blocking observer policies. */
export type PubSubOptions =
  | { strategy?: 'unbounded'; replay?: number }
  | { strategy: 'dropping' | 'sliding'; capacity: number; replay?: number };

export interface PubSubStatus {
  enabled: boolean;
  shutdown: boolean;
  strategy?: 'unbounded' | 'dropping' | 'sliding';
  accepted: number;
  rejected: number;
}

/** Optional queued observation; normal callbacks never depend on consumers draining. */
export class EmissionHub<A> {
  private hub?: PubSub.PubSub<A>;
  private configuration?: { strategy: 'unbounded' | 'dropping' | 'sliding'; capacity: number; replay: number };
  private accepted = 0;
  private rejected = 0;

  get enabled(): boolean { return !!this.hub && !PubSub.isShutdownUnsafe(this.hub); }

  get(options?: PubSubOptions): PubSub.PubSub<A> {
    if (this.hub && options === undefined) return this.hub;
    const strategy = options?.strategy ?? 'unbounded';
    const capacity = options && 'capacity' in options ? options.capacity : Infinity;
    const replay = options?.replay ?? 0;
    if (!['unbounded', 'dropping', 'sliding'].includes(strategy)) throw new TypeError('PubSub observations require a non-blocking strategy');
    if (strategy === 'unbounded' && options && 'capacity' in options) throw new TypeError('Choose dropping or sliding when specifying PubSub capacity');
    if (strategy !== 'unbounded' && (!Number.isInteger(capacity) || capacity <= 0)) throw new TypeError('PubSub capacity must be a positive integer');
    if (!Number.isInteger(replay) || replay < 0) throw new TypeError('PubSub replay must be a non-negative integer');
    if (this.hub) {
      const current = this.configuration!;
      if (current.strategy !== strategy || current.capacity !== capacity || current.replay !== replay) throw new Error('PubSub is already configured; choose its options before subscribing');
      return this.hub;
    }
    const hub = Effect.runSync(strategy === 'unbounded'
      ? PubSub.unbounded<A>({ replay })
      : strategy === 'dropping' ? PubSub.dropping<A>({ capacity, replay }) : PubSub.sliding<A>({ capacity, replay }));
    this.configuration = { strategy, capacity, replay };
    this.hub = hub;
    return hub;
  }

  publish(value: A): void {
    if (!this.hub) return;
    // publishUnsafe intentionally skips surplus handling. Sliding must use the
    // effectful API so a full hub evicts its oldest item instead of rejecting.
    const accepted = this.configuration!.strategy === 'sliding'
      ? Effect.runSync(PubSub.publish(this.hub, value))
      : PubSub.publishUnsafe(this.hub, value);
    if (accepted) this.accepted++;
    else this.rejected++;
  }

  status(): PubSubStatus {
    return {
      enabled: !!this.hub,
      shutdown: !!this.hub && PubSub.isShutdownUnsafe(this.hub),
      strategy: this.configuration?.strategy,
      accepted: this.accepted,
      rejected: this.rejected,
    };
  }

  close(): Effect.Effect<void> { return this.hub ? PubSub.shutdown(this.hub) : Effect.void; }
}
