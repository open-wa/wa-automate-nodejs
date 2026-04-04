import type { Hono } from 'hono';
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { OpenWAEventMap } from '../events/eventMap.js';
import type {
  Plugin,
  Hooks,
  PluginInput,
  PluginMeta,
  ToolDefinition,
  DashboardPage,
  PluginManifest,
  PluginManifestEntry,
  PluginClient,
} from '@open-wa/plugin-sdk';
import { createEventGateway, getPublicEvents } from './EventGateway.js';
import { validatePluginConfig } from './PluginLoader.js';

// ============================================================================
// Hook → Event mapping
// ============================================================================

/** Maps plugin hook shorthand names to actual OpenWAEventMap keys */
const HOOK_EVENT_MAPPING: Record<string, keyof OpenWAEventMap> = {
  'core.starting': 'core.starting',
  'core.started': 'core.started',
  'core.stopping': 'core.stopping',
  'auth.qr': 'launch.auth.qr.generated',
  'auth.authenticated': 'launch.auth.check.after',
  'client.ready': 'client.ready',
  'message.received': 'message.received',
  'message.sent': 'message.any',
  'message.ack': 'ack.changed',
};

// ============================================================================
// Internal types
// ============================================================================

interface PluginEntry {
  meta: PluginMeta;
  hooks: Hooks;
}

// ============================================================================
// PluginHost
// ============================================================================

/**
 * Central registry for plugin lifecycle management.
 *
 * Responsibilities:
 * - Plugin registration with security-filtered input
 * - Wiring hooks to HyperEmitter events
 * - Collecting routes, pages, and tools from plugins
 * - Generating the runtime manifest for the dashboard
 * - Clean disposal of all plugins
 */
export class PluginHost {
  private plugins = new Map<string, PluginEntry>();
  private readonly logger: Logger;
  private readonly events: HyperEmitter<OpenWAEventMap>;

  constructor(events: HyperEmitter<OpenWAEventMap>, logger: Logger) {
    this.events = events;
    this.logger = logger;
  }

  /**
   * Register a plugin with security-filtered input.
   *
   * @param plugin - The plugin function (created via createPlugin())
   * @param options - Registration options
   */
  async register(
    plugin: Plugin,
    options: {
      sessionId: string;
      client: PluginClient;
      pluginConfig?: Record<string, unknown>;
    }
  ): Promise<void> {
    const name = plugin.meta.name;

    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is already registered`);
    }

    // Validate config against plugin's schema
    const rawConfig = options.pluginConfig?.[name];
    const validatedConfig = validatePluginConfig(plugin, rawConfig, this.logger);

    // Create security-filtered event emitter
    const gateway = createEventGateway(this.events, name, this.logger);

    // Build the plugin input
    const input: PluginInput = {
      events: gateway,
      logger: this.createScopedLogger(name),
      config: validatedConfig,
      sessionId: options.sessionId,
      client: options.client,
    };

    // Initialize the plugin
    const hooks = await plugin(input);
    this.plugins.set(name, { meta: plugin.meta, hooks });

    // Wire hooks to events
    this.wireHooks(name, hooks);

    this.logger.info('plugin_registered', {
      plugin: name,
      version: plugin.meta.version ?? 'unknown',
      hasRoutes: !!hooks.routes,
      pageCount: hooks.pages?.length ?? 0,
      toolCount: hooks.tool ? Object.keys(hooks.tool).length : 0,
    });
  }

  // ── Hook Wiring ──────────────────────────────────────────

  private wireHooks(name: string, hooks: Hooks): void {
    this.wireSpecificHooks(name, hooks);
    this.wireCatchAllHandler(name, hooks);
  }

  private wireSpecificHooks(name: string, hooks: Hooks): void {
    for (const [hookName, eventName] of Object.entries(HOOK_EVENT_MAPPING)) {
      const handler = hooks[hookName as keyof Hooks];
      if (handler && typeof handler === 'function') {
        this.events.on(eventName, async (payload: unknown) => {
          try {
            await (handler as (payload: unknown) => Promise<void>)(payload);
          } catch (err) {
            this.logger.error('plugin_hook_error', {
              plugin: name,
              event: hookName,
              error: err,
            });
          }
        });
      }
    }
  }

  private wireCatchAllHandler(name: string, hooks: Hooks): void {
    if (!hooks.event) return;

    const catchAllHandler = hooks.event;
    const publicEvents = getPublicEvents();

    for (const eventName of publicEvents) {
      this.events.on(eventName, async (payload: unknown) => {
        try {
          await catchAllHandler({ event: eventName, payload });
        } catch (err) {
          this.logger.error('plugin_catchall_error', {
            plugin: name,
            event: eventName,
            error: err,
          });
        }
      });
    }
  }

  // ── Route Collection ─────────────────────────────────────

  /**
   * Get all plugin-provided Hono sub-applications.
   * Each entry is ready to be mounted at `/plugins/<name>/`.
   */
  getRoutes(): Array<{ name: string; router: Hono }> {
    const routes: Array<{ name: string; router: Hono }> = [];
    for (const [name, { hooks }] of this.plugins) {
      if (hooks.routes) {
        try {
          routes.push({ name, router: hooks.routes() });
        } catch (err) {
          this.logger.error('plugin_routes_error', { plugin: name, error: err });
        }
      }
    }
    return routes;
  }

  // ── Page Collection ──────────────────────────────────────

  /**
   * Get all plugin-declared dashboard pages with plugin context.
   */
  getPages(): Array<DashboardPage & { pluginName: string }> {
    const pages: Array<DashboardPage & { pluginName: string }> = [];
    for (const [name, { hooks }] of this.plugins) {
      if (hooks.pages) {
        for (const page of hooks.pages) {
          pages.push({ ...page, pluginName: name });
        }
      }
    }
    return pages.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  }

  // ── Tool Collection ──────────────────────────────────────

  /**
   * Get all plugin-registered tools, namespaced by plugin.
   */
  getTools(): Record<string, { plugin: string; tool: ToolDefinition }> {
    const tools: Record<string, { plugin: string; tool: ToolDefinition }> = {};
    for (const [name, { hooks }] of this.plugins) {
      if (hooks.tool) {
        for (const [toolName, toolDef] of Object.entries(hooks.tool)) {
          tools[`${name}.${toolName}`] = { plugin: name, tool: toolDef };
        }
      }
    }
    return tools;
  }

  // ── Manifest ─────────────────────────────────────────────

  /**
   * Generate the runtime manifest consumed by the dashboard.
   * Served at GET /plugins/manifest.
   */
  getManifest(): PluginManifest {
    const plugins: PluginManifestEntry[] = [];
    for (const [name, { meta, hooks }] of this.plugins) {
      plugins.push({
        name,
        version: meta.version,
        description: meta.description,
        pages: hooks.pages ?? [],
        hasRoutes: !!hooks.routes,
        tools: hooks.tool ? Object.keys(hooks.tool) : [],
      });
    }
    return { plugins };
  }

  // ── Lifecycle ────────────────────────────────────────────

  /**
   * Dispose all plugins in reverse registration order.
   */
  async dispose(): Promise<void> {
    const entries = Array.from(this.plugins.entries()).reverse();
    for (const [name, { hooks }] of entries) {
      if (hooks.dispose) {
        try {
          await hooks.dispose();
        } catch (err) {
          this.logger.error('plugin_dispose_error', { plugin: name, error: err });
        }
      }
    }
    this.plugins.clear();
  }

  // ── Queries ──────────────────────────────────────────────

  getPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  getPluginCount(): number {
    return this.plugins.size;
  }

  // ── Private Helpers ──────────────────────────────────────

  private createScopedLogger(pluginName: string): Logger {
    // Wrap the logger to automatically prefix all messages with the plugin name
    const scoped = Object.create(this.logger);
    for (const method of ['info', 'warn', 'error', 'debug'] as const) {
      const original = this.logger[method].bind(this.logger);
      scoped[method] = (msg: string, meta?: Record<string, unknown>) => {
        original(msg, { ...meta, plugin: pluginName });
      };
    }
    return scoped;
  }
}
