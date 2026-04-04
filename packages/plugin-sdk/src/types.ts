/**
 * @open-wa/plugin-sdk — Plugin Type Definitions
 *
 * This module defines the complete contract between plugins and the open-wa host.
 * Plugin developers should use `createPlugin()` instead of implementing these directly.
 */
import type { Hono } from 'hono';
import type { z } from 'zod';

// ============================================================================
// Plugin Input — What plugins receive from the host
// ============================================================================

/**
 * The input bundle passed to a plugin's init function.
 * Everything a plugin needs to operate, with security filters already applied.
 */
export interface PluginInput<TConfig = unknown> {
  /**
   * Security-filtered event emitter.
   * - Internal events (launch.*, browser.*) are blocked
   * - Sensitive events (license.*, session data) are blocked
   * - Plugins can ONLY subscribe — emitting is forbidden
   */
  events: PluginEventEmitter;

  /** Scoped logger: all output is automatically prefixed with the plugin name */
  logger: PluginLogger;

  /**
   * Plugin config from the global config file, already validated against
   * the plugin's configSchema (if one was provided).
   *
   * Access via `pluginConfig: { "your-plugin-name": { ...these values... } }`
   * in the wa.config.js/json.
   */
  config: TConfig;

  /** Current session ID */
  sessionId: string;

  /**
   * Client proxy for calling WA methods.
   *
   * This is the full SocketClient interface — you can call any method
   * that's available on the regular Client (sendText, sendImage, etc).
   *
   * Under the hood this is backed by a SocketClient-style proxy;
   * plugins never get direct browser/CDP access.
   */
  client: PluginClient;
}

// ============================================================================
// Plugin Client — SocketClient method surface
// ============================================================================

/**
 * The client interface exposed to plugins.
 *
 * This mirrors the SocketClient `ask()` pattern: you can call any method
 * that exists on the WA Client. The type is intentionally broad — it's
 * backed by a dynamic proxy that forwards calls to the host.
 *
 * Common methods:
 * - sendText(to, content) → messageId
 * - sendImage(to, url, filename, caption?) → messageId
 * - sendLocation(to, lat, lng, text?) → messageId
 * - sendLinkWithAutoPreview(to, url, text) → messageId
 * - decryptMedia(message) → base64 string
 * - getHostNumber() → phone number string
 * - getContact(contactId) → contact object
 * - sendFile(to, file, filename, caption?) → messageId
 * - reply(to, content, quotedMsgId) → messageId
 * - forwardMessages(to, messages, skipMyMessages?) → boolean
 *
 * See the full Client interface in @open-wa/wa-automate-types-only.
 */
export interface PluginClient {
  /**
   * Call any WA method by name.
   * @param method Method name (e.g. 'sendText', 'sendImage')
   * @param args Arguments to pass to the method
   */
  ask<T = unknown>(method: string, args?: unknown[] | Record<string, unknown>): Promise<T>;

  /**
   * Listen for WA events.
   * @param listener Listener name (e.g. 'onMessage', 'onAnyMessage')
   * @param callback Callback function
   */
  listen(listener: string, callback: (data: unknown) => void): Promise<string>;

  // Convenience methods (all delegate to ask() under the hood)
  sendText(to: string, content: string): Promise<string>;
  sendImage(to: string, url: string, filename: string, caption?: string): Promise<string>;
  sendFile(to: string, base64: string, filename: string, caption?: string): Promise<string>;
  sendLocation(to: string, lat: string, lng: string, text?: string): Promise<string>;
  sendLinkWithAutoPreview(to: string, url: string, text: string): Promise<string>;
  reply(to: string, content: string, quotedMsgId: string): Promise<string>;
  decryptMedia(message: unknown): Promise<string>;
  getHostNumber(): Promise<string>;
  getContact(contactId: string): Promise<unknown>;
  getAllContacts(): Promise<unknown[]>;
  getAllChats(): Promise<unknown[]>;
  sendSeen(chatId: string): Promise<boolean>;
  // Any other method works via the Proxy — these typed ones are just for convenience
  [method: string]: ((...args: unknown[]) => Promise<unknown>) | unknown;
}

// ============================================================================
// Plugin Event Emitter — Security-filtered interface
// ============================================================================

/**
 * Security-filtered event emitter.
 *
 * Plugins can ONLY subscribe to public events. They cannot:
 * - Emit events
 * - Listen to internal events (launch.*, browser.*, transport.*)
 * - Listen to sensitive events (license.*, session file access)
 */
export interface PluginEventEmitter {
  on<K extends string>(event: K, handler: (payload: unknown) => void): void;
  once<K extends string>(event: K, handler: (payload: unknown) => void): void;
  off<K extends string>(event: K, handler: (payload: unknown) => void): void;
}

// ============================================================================
// Plugin Logger
// ============================================================================

export interface PluginLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

// ============================================================================
// Plugin Output — What plugins return to the host
// ============================================================================

/**
 * Hooks returned by a plugin's init function.
 *
 * All hooks are optional — use only what your plugin needs.
 */
export interface Hooks {
  // ── Generic Event Handler ──────────────────────────────
  /**
   * Catch-all event handler. Receives every public event.
   * Use this when you need to react to events that don't have a specific hook.
   */
  event?: (input: { event: string; payload: unknown }) => Promise<void>;

  // ── Lifecycle Hooks ────────────────────────────────────
  'core.starting'?: (payload: { config: unknown }) => Promise<void>;
  'core.started'?: () => Promise<void>;
  'core.stopping'?: (payload: { reason?: string }) => Promise<void>;
  'client.ready'?: (payload: { sessionId: string }) => Promise<void>;

  // ── Auth Hooks ─────────────────────────────────────────
  'auth.qr'?: (payload: { sessionId: string; qr: string; attempt: number }) => Promise<void>;
  'auth.authenticated'?: (payload: { sessionId: string }) => Promise<void>;

  // ── Message Hooks ──────────────────────────────────────
  'message.received'?: (payload: { message: unknown }) => Promise<void>;
  'message.sent'?: (payload: { message: unknown }) => Promise<void>;
  'message.ack'?: (payload: { messageId: string; ack: unknown }) => Promise<void>;

  // ── Message Interceptors ───────────────────────────────
  /**
   * Called BEFORE a message is sent. Can modify content.
   * Useful for content filtering, auto-translation, etc.
   */
  'message.send.before'?: (
    input: { to: string; content: unknown },
    output: { content: unknown; metadata?: Record<string, unknown> }
  ) => Promise<void>;

  /**
   * Called AFTER a message is sent. Can add metadata.
   */
  'message.send.after'?: (
    input: { messageId: string; to: string },
    output: { metadata?: Record<string, unknown> }
  ) => Promise<void>;

  // ── API Routes ─────────────────────────────────────────
  /**
   * Return a Hono sub-app that will be mounted at `/plugins/<plugin-name>/`.
   *
   * @example
   * ```ts
   * routes: () => {
   *   const app = new Hono();
   *   app.post('/webhook', async (c) => {
   *     const body = await c.req.json();
   *     // handle incoming webhook
   *     return c.json({ ok: true });
   *   });
   *   return app;
   * }
   * ```
   */
  routes?: () => Hono;

  // ── Dashboard Pages ────────────────────────────────────
  /**
   * Declare dashboard pages this plugin provides.
   * Pages are rendered in the dashboard sidebar and loaded on demand.
   */
  pages?: DashboardPage[];

  // ── Tools (AI/Automation) ──────────────────────────────
  /**
   * Register tools that can be called by AI agents or automation scripts.
   */
  tool?: Record<string, ToolDefinition>;

  // ── Cleanup ────────────────────────────────────────────
  /**
   * Called when the session is shutting down.
   * Use this to clean up resources (close connections, flush queues, etc).
   */
  dispose?: () => Promise<void>;
}

// ============================================================================
// Dashboard Page Declaration
// ============================================================================

/**
 * Declares a page that this plugin wants rendered in the dashboard.
 *
 * For v1, the dashboard renders a standard status/config view for plugins.
 * Custom React component support will come later.
 */
export interface DashboardPage {
  /** Route segment: becomes `/plugins/<pluginName>/<path>` in the dashboard */
  path: string;

  /** Display title shown in the sidebar */
  title: string;

  /** Icon — emoji or Lucide icon name */
  icon?: string;

  /** Sort order within the Plugins sidebar group (lower = higher) */
  order?: number;

  /**
   * Optional description shown in the plugin's default status view.
   */
  description?: string;
}

// ============================================================================
// Plugin Metadata
// ============================================================================

export interface PluginMeta {
  /** Unique plugin identifier. Used as config key and route prefix. */
  name: string;
  version?: string;
  description?: string;
  author?: string;
  homepage?: string;
}

// ============================================================================
// Tool Definitions (for AI/automation)
// ============================================================================

export interface ToolDefinition {
  description: string;
  args: Record<string, z.ZodType>;
  execute: (args: Record<string, unknown>, context: ToolContext) => Promise<string>;
}

export interface ToolContext {
  sessionId: string;
  logger: PluginLogger;
  abort: AbortSignal;
}

// ============================================================================
// Plugin — The top-level type
// ============================================================================

/**
 * A Plugin is a function that receives PluginInput and returns Hooks.
 * It also carries metadata and an optional config schema.
 *
 * Use `createPlugin()` to create one with proper type inference.
 */
export type Plugin<TConfig = unknown> = {
  (input: PluginInput<TConfig>): Promise<Hooks>;
  meta: PluginMeta;
  configSchema?: z.ZodType<TConfig>;
};

// ============================================================================
// Plugin Manifest — what the dashboard fetches at runtime
// ============================================================================

export interface PluginManifestEntry {
  name: string;
  version?: string;
  description?: string;
  pages: DashboardPage[];
  hasRoutes: boolean;
  tools: string[];
}

export interface PluginManifest {
  plugins: PluginManifestEntry[];
}
