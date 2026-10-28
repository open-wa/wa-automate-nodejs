import type { Hono } from 'hono';
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { HostHooks } from '@open-wa/config';
import type { OpenWAEventMap } from '../events/eventMap';
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
import { createEventGateway, getPublicEvents } from './EventGateway';
import { validatePluginConfig } from './PluginLoader';
import { HookPipeline } from './HookPipeline';

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
  sessionId: string;
  meta: PluginMeta;
  hooks: Hooks;
  abortController: AbortController;
  activeHandlers: Set<Promise<void>>;
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
  private serviceController = new AbortController();
  private services = new Map<string, Promise<{ value: unknown; dispose: () => void | Promise<void> }>>();
  private runtimeInvoker?: (method: string, args: unknown[]) => Promise<unknown>;
  private readonly logger: Logger;
  private readonly events: HyperEmitter<OpenWAEventMap>;
  private readonly hookPipeline: HookPipeline;
  private readonly hasHostHooks: boolean;

  constructor(events: HyperEmitter<OpenWAEventMap>, logger: Logger, hooks?: HostHooks) {
    this.events = events;
    this.logger = logger;
    this.hasHostHooks = Boolean(hooks);
    this.hookPipeline = new HookPipeline(hooks, async () => this.runtimeInvoker?.('getActiveCall', []));
  }

  /** Bound by the public Client facade; core never imports that package. */
  bindRuntime(invoke: (method: string, args: unknown[]) => Promise<unknown>): void {
    this.runtimeInvoker = invoke;
  }

  /** Bound by the public Client facade; core never imports that package. */
  bindRuntime(invoke: (method: string, args: unknown[]) => Promise<unknown>): void {
    this.runtimeInvoker = invoke;
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

    const abortController = new AbortController();

    // Create security-filtered event emitter
    const gateway = createEventGateway(
      this.events,
      name,
      this.logger,
      abortController.signal,
      (event, payload) => this.allowPluginEvent(name, options.sessionId, event, payload),
    );

    // Build the plugin input
    const input: PluginInput = {
      events: gateway,
      logger: this.createScopedLogger(name),
      config: validatedConfig,
      sessionId: options.sessionId,
      client: this.guardedClient(options.client, name, options.sessionId, abortController.signal),
      runtime: {
        invoke: async <T = unknown>(method: string, args: unknown[] = []): Promise<T> => {
          if (abortController.signal.aborted) throw new Error('Plugin has stopped.');
          if (!this.runtimeInvoker) throw new Error('The host Client facade is not attached.');
          const context = { plugin: name, sessionId: options.sessionId, method, args };
          await this.hookPipeline.beforeAction(context);
          abortController.signal.throwIfAborted();
          return this.hookPipeline.result(await this.runtimeInvoker(method, args) as T, context);
        },
      },
      signal: abortController.signal,
      services: {
        getOrCreate: async <T>(key: string, create: (signal: AbortSignal) => Promise<{ value: T; dispose: () => void | Promise<void> }>): Promise<T> => {
          this.serviceController.signal.throwIfAborted();
          const scoped = `${options.sessionId}\0${key}`;
          let pending = this.services.get(scoped);
          if (!pending) {
            pending = Promise.resolve().then(() => create(this.serviceController.signal));
            this.services.set(scoped, pending);
            void pending.catch(() => { if (this.services.get(scoped) === pending) this.services.delete(scoped); });
          }
          const service = await pending;
          this.serviceController.signal.throwIfAborted();
          return service.value as T;
        },
      },
    };

    // Initialize the plugin
    let hooks: Hooks;
    try {
      hooks = await plugin(input);
    } catch (error) {
      abortController.abort(error);
      throw error;
    }
    this.plugins.set(name, {
      sessionId: options.sessionId,
      meta: plugin.meta,
      hooks,
      abortController,
      activeHandlers: new Set(),
    });

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
    const entry = this.plugins.get(name);
    if (!entry) throw new Error(`Plugin "${name}" is not registered`);

    for (const [hookName, eventName] of Object.entries(HOOK_EVENT_MAPPING)) {
      const handler = hooks[hookName as keyof Hooks];
      if (handler && typeof handler === 'function') {
        this.events.on(
          eventName,
          (payload: unknown) => this.superviseHandler(
            entry,
            'plugin_hook_error',
            hookName,
            async () => {
              if (await this.allowPluginEvent(name, entry.sessionId, eventName, payload)) {
                await (handler as (payload: unknown) => void | Promise<void>)(payload);
              }
            },
          ),
          { signal: entry.abortController.signal },
        );
      }
    }
  }

  private wireCatchAllHandler(name: string, hooks: Hooks): void {
    if (!hooks.event) return;

    const entry = this.plugins.get(name);
    if (!entry) throw new Error(`Plugin "${name}" is not registered`);
    const catchAllHandler = hooks.event;
    const publicEvents = getPublicEvents();

    for (const eventName of publicEvents) {
      this.events.on(
        eventName,
        (payload: unknown) => this.superviseHandler(
          entry,
          'plugin_catchall_error',
          eventName,
          async () => {
            if (await this.allowPluginEvent(name, entry.sessionId, eventName, payload)) {
              await catchAllHandler({ event: eventName, payload });
            }
          },
        ),
        { signal: entry.abortController.signal },
      );
    }
  }

  private async allowPluginEvent(plugin: string, sessionId: string, event: string, payload: unknown): Promise<boolean> {
    try { return await this.hookPipeline.beforeEvent({ plugin, sessionId, event, payload }); }
    catch (error) { this.logger.error('plugin_event_hook_error', { plugin, event, error }); return false; }
  }

  private guardedClient(client: PluginClient, plugin: string, sessionId: string, signal: AbortSignal): PluginClient {
    if (!this.hasHostHooks) return client;
    return new Proxy(client, { get: (target, name) => {
      if (name === 'then') return undefined;
      const member = Reflect.get(target, name);
      if (typeof name !== 'string' || typeof member !== 'function') return member;
      return async (...values: unknown[]) => {
        signal.throwIfAborted();
        const method = name === 'ask' ? String(values[0]) : name;
        const args = name === 'ask' ? (values[1] ?? []) as unknown[] | Record<string, unknown> : values;
        const context = { plugin, sessionId, method, args };
        await this.hookPipeline.beforeAction(context);
        signal.throwIfAborted();
        const result = name === 'ask' ? await Reflect.apply(member, target, [method, args]) : await Reflect.apply(member, target, args as unknown[]);
        return this.hookPipeline.result(result, context);
      };
    } });
  }

  private superviseHandler(
    entry: PluginEntry,
    logEvent: 'plugin_hook_error' | 'plugin_catchall_error',
    event: string,
    handler: () => void | Promise<void>,
  ): Promise<void> {
    const task = Promise.resolve()
      .then(handler)
      .catch((error) => {
        this.logger.error(logEvent, {
          plugin: entry.meta.name,
          event,
          error,
        });
      })
      .finally(() => {
        entry.activeHandlers.delete(task);
      });
    entry.activeHandlers.add(task);
    return task;
  }

  // ── Route Collection ─────────────────────────────────────

  /**
   * Get all plugin-provided Hono sub-applications.
   * Each entry is ready to be mounted at `/plugins/<name>/`.
   */
  getRoutes(): Array<{ name: string; router: Hono; routeAuth?: 'host' }> {
    const routes: Array<{ name: string; router: Hono; routeAuth?: 'host' }> = [];
    for (const [name, { hooks }] of this.plugins) {
      if (hooks.routes) {
        try {
          routes.push({ name, router: hooks.routes(), routeAuth: hooks.routeAuth });
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
        chat: hooks.chat,
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
    this.serviceController.abort();
    const entries = Array.from(this.plugins.entries()).reverse();
    for (const [name, entry] of entries) {
      entry.abortController.abort();
      await Promise.allSettled([...entry.activeHandlers]);
      const { hooks } = entry;
      if (hooks.dispose) {
        try {
          await hooks.dispose();
        } catch (err) {
          this.logger.error('plugin_dispose_error', { plugin: name, error: err });
        }
      }
    }
    this.plugins.clear();
    for (const pending of [...this.services.values()].reverse()) {
      try { await (await pending).dispose(); }
      catch (error) { this.logger.error('plugin_service_dispose_error', { error }); }
    }
    this.services.clear();
    this.runtimeInvoker = undefined;
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
