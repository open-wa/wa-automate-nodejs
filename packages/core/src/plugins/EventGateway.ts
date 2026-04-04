/**
 * EventGateway — Security-filtered event emitter proxy for plugins
 *
 * Creates a read-only view of HyperEmitter that mechanically enforces
 * the security policy defined in OpenWAEventMetaMap:
 *
 * - Events with `internal: true` → silently blocked
 * - Events with `sensitive: true` → silently blocked
 * - `.emit()` → not exposed (plugins are consumers only)
 *
 * This replaces the old manually-curated CATCHABLE_EVENTS allowlist
 * with a policy derived from the source of truth.
 */
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { OpenWAEventMap } from '../events/eventMap.js';
import { OpenWAEventMetaMap } from '../events/eventMap.js';
import type { Logger } from '@open-wa/logger';
import type { PluginEventEmitter } from '@open-wa/plugin-sdk';

/**
 * Creates a security-filtered event emitter for a plugin.
 *
 * The returned object only allows subscribing to public, non-sensitive events.
 * Any attempt to listen to a blocked event is silently ignored with a warning log.
 */
export function createEventGateway(
  emitter: HyperEmitter<OpenWAEventMap>,
  pluginName: string,
  logger: Logger
): PluginEventEmitter {
  const isBlocked = (event: string): boolean => {
    const meta = OpenWAEventMetaMap[event as keyof OpenWAEventMap];
    if (!meta) return false; // unknown events pass through (forward compat)
    return meta.internal || meta.sensitive;
  };

  return {
    on(event: string, handler: (payload: unknown) => void) {
      if (isBlocked(event)) {
        logger.warn('plugin_event_blocked', {
          plugin: pluginName,
          event,
          reason: 'internal or sensitive',
        });
        return;
      }
      emitter.on(event as keyof OpenWAEventMap, handler as never);
    },

    once(event: string, handler: (payload: unknown) => void) {
      if (isBlocked(event)) {
        logger.warn('plugin_event_blocked', {
          plugin: pluginName,
          event,
          reason: 'internal or sensitive',
        });
        return;
      }
      emitter.once(event as keyof OpenWAEventMap, handler as never);
    },

    off(event: string, handler: (payload: unknown) => void) {
      emitter.off(event as keyof OpenWAEventMap, handler as never);
    },
  };
}

/**
 * Returns the list of events that are NOT blocked by the gateway.
 * Useful for the catch-all event handler to know which events to wire.
 */
export function getPublicEvents(): (keyof OpenWAEventMap)[] {
  return (Object.entries(OpenWAEventMetaMap) as [keyof OpenWAEventMap, { internal: boolean; sensitive: boolean }][])
    .filter(([, meta]) => !meta.internal && !meta.sensitive)
    .map(([event]) => event);
}
