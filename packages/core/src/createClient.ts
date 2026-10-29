import { SessionRefreshController } from './livePatch/SessionRefreshController';
import { installDocumentRuntime } from './livePatch/installDocument';
import type { SessionRefreshOptions, SessionRefreshResult, SessionRefreshSnapshot } from '@open-wa/schema';
import { HyperEmitter } from '@open-wa/hyperemitter';
import { createLogger, Logger } from '@open-wa/logger';
import type { IDriver, LightpandaOptions, BrowserProvisionOptions } from '@open-wa/driver-interface';
import { requireCapability, type CapabilitySubject } from '@open-wa/driver-interface';
import { OpenWAEventMap, STATE } from './events/eventMap';
import { attachGlobalEvents } from './events/globalEvents';
import { PluginHost, loadPlugins } from './plugins/index';
import type { Plugin, PluginClient } from '@open-wa/plugin-sdk';
import {
  SessionManager,
  SessionStore,
  type SessionReadinessSnapshot,
} from './sessionmanager/index';
import { Transport } from './transport/index';
import type {
  LicenseKeyResolver,
  PatchFetchConfig,
  LicenseServerConfig,
} from './transport/index';
import { Effect } from 'effect';
import type { CallingOptions } from '@open-wa/schema';
import type { CallMediaHost } from './calling/ports';
import {
  SessionScope,
  type SessionAdmissionShape,
  type SessionFinalizerReason,
  type ChatSandboxPolicy,
  type ExecutionSandboxShape,
  type SandboxCapabilityHandlers,
  type RuntimeObservabilityShape,
  type RuntimeCauseRecord,
  makeInMemoryObservability,
} from '@open-wa/runtime-core';

import type { SessionPersistenceConfig } from './transport/sessionPersistence';
import type { SessionEncryptionOptions } from './transport/sessionEncryption';
import type { HostHooks } from '@open-wa/config';

export interface CreateClientOptions extends SessionPersistenceConfig, SessionEncryptionOptions {
  driver: IDriver;
  calling?: CallingOptions;
  callMediaHost?: CallMediaHost;
  /** Forward supported SimpleListener events to the shared ev helper. Default: true. */
  eventMode?: boolean;
  deleteSessionDataOnLogout?: boolean;
  killClientOnLogout?: boolean;

  /**
   * Plugins can be provided directly as Plugin objects,
   * or loaded from config via plugin refs (npm names / paths).
   */
  plugins?: Plugin[];

  /**
   * Config-driven plugin loading: array of npm package names or file paths.
   * These are dynamically imported at startup.
   *
   * @example ['@open-wa/integration-chatwoot', './my-local-plugin']
   */
  pluginRefs?: string[];

  /**
   * Plugin configuration keyed by plugin name.
   * Each plugin gets its own config object, validated against its configSchema.
   *
   * @example { "chatwoot": { apiUrl: "...", token: "..." } }
   */
  pluginConfig?: Record<string, unknown>;
  /** Operator-owned pre-dispatch hooks and plugin chat restrictions. */
  hooks?: HostHooks;

  sessionStore?: SessionStore;
  debug?: boolean;
  waWebUrl?: string;
  headless?: boolean;
  qrTimeoutMs?: number;
  authTimeoutMs?: number;
  oorTimeoutMs?: number;
  navigationTimeoutMs?: number;
  executablePath?: string;
  browser?: BrowserProvisionOptions;
  watermark?: boolean | { text?: string; color?: string; background?: string; };
  browserArgs?: string[];
  allowDangerousBrowserArgs?: boolean;
  userDataDir?: string;
  /**
   * Compact auth always uses a disposable profile, regardless of this setting.
   * @default false
   */
  ephemeral?: boolean;
  linkCode?: string;
  qrMax?: number;
  ignoreNuke?: boolean;
  logConsole?: boolean;
  logConsoleErrors?: boolean;
  blockCrashLogs?: boolean;
  blockAssets?: boolean;
  licenseKey?: LicenseKeyResolver;
  safeMode?: boolean;
  lightpanda?: LightpandaOptions;

  /**
   * Configuration for remote patch fetching from cdn.openwa.dev.
   * Controls caching and fallback between OpenWA patch sources.
   */
  patchConfig?: PatchFetchConfig;

  /**
   * Configuration for remote license validation via funcs.openwa.dev.
   * Controls offline mode.
   */
  licenseConfig?: LicenseServerConfig;

  /** Optional process-wide admission policy used to cap browser-session RAM. */
  sessionAdmission?: SessionAdmissionShape;

  /** Estimated RAM reservation for this browser session. Defaults to 512 MiB. */
  estimatedMemoryMb?: number;

  /** Execution adapter and policy for explicit per-chat user-code isolation. */
  executionSandbox?: ExecutionSandboxShape;
  sandboxPolicy?: ChatSandboxPolicy;
  /** Extra parent-side capabilities that isolated chat code may request by name. */
  sandboxCapabilities?: SandboxCapabilityHandlers;
  observability?: RuntimeObservabilityShape;
  /** Runtime-specific memory sampler. Its fiber is owned by the session Scope. */
  memoryObservation?: (
    observability: RuntimeObservabilityShape,
    getBrowserProcessId: () => number | undefined,
  ) => Effect.Effect<never, unknown>;
}

export interface OpenWAClient {
  readonly sessionId: string;
  readonly events: HyperEmitter<OpenWAEventMap>;
  readonly logger: Logger;
  readonly session: SessionManager;
  readonly plugins: PluginHost;
  readonly config: Readonly<Pick<CreateClientOptions, 'deleteSessionDataOnLogout' | 'killClientOnLogout' | 'sessionDataPath' | 'userDataDir'>>;
  readonly observability: RuntimeObservabilityShape;

  registerFinalizationHook(hook: () => void | Promise<void>): () => void;
  requestRefresh(options?: SessionRefreshOptions): { operationId: string };
  refresh(options?: SessionRefreshOptions): Promise<SessionRefreshResult>;
  getRefreshStatus(): Promise<SessionRefreshSnapshot>;
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
  getState(): STATE;
  getReadiness(): SessionReadinessSnapshot;
  getTransport(): Transport;
  screenshot(): Promise<Uint8Array | null>;
  evaluateScript<T = unknown>(script: string): Promise<T | null>;
  executeInChatSandbox<T = unknown>(chatId: string, source: string, input?: unknown): Promise<T>;
  closeChatSandbox(chatId: string): Promise<void>;
  getRuntimeMetrics(): Promise<Readonly<Record<string, number>>>;
  getRuntimeCauses(): Promise<ReadonlyArray<RuntimeCauseRecord>>;
}

function hasCapabilitySubject(driver: IDriver): driver is IDriver & CapabilitySubject {
  return 'capabilities' in driver;
}

/**
 * Create a PluginClient proxy backed by a transport-level ask() pattern.
 * This mirrors SocketClient's Proxy approach — any method call becomes
 * an `ask(methodName, args)` invocation.
 */
function createPluginClientProxy(transport: Transport, logger: Logger): PluginClient {
  const ask = async <T = unknown>(method: string, args?: unknown[] | Record<string, unknown>): Promise<T> => {
    const page = transport.getPage();
    if (!page || page.isClosed()) {
      throw new Error(`Cannot call "${method}" — page is not available`);
    }
    // Delegate to the transport's evaluateScript which runs WAPI calls
    const argsStr = JSON.stringify(args ?? []);
    const result = await transport.evaluateScript<T>(
      `window.WAPI.${method}(...${argsStr})`
    );
    return result as T;
  };

  const listen = async (listener: string, callback: (data: unknown) => void): Promise<string> => {
    logger.warn('plugin_listen_not_supported', {
      listener,
      reason: 'Direct listen is not supported on SDK-level PluginClient. Use event hooks instead.',
    });
    return 'noop';
  };

  // Base object with explicit convenience methods delegating to ask()
  const base: Partial<PluginClient> = {
    ask,
    listen,
    sendText: (to: string, content: string) => ask('sendText', [to, content]),
    sendImage: (to: string, url: string, filename: string, caption?: string) => ask('sendImage', [to, url, filename, caption ?? '']),
    sendFile: (to: string, base64: string, filename: string, caption?: string) => ask('sendFile', [to, base64, filename, caption ?? '']),
    sendLocation: (to: string, lat: string, lng: string, text?: string) => ask('sendLocation', [to, lat, lng, text ?? '']),
    sendLinkWithAutoPreview: (to: string, url: string, text: string) => ask('sendLinkWithAutoPreview', [to, url, text]),
    reply: (to: string, content: string, quotedMsgId: string) => ask('reply', [to, content, quotedMsgId]),
    decryptMedia: (message: unknown) => ask('decryptMedia', [message]),
    getHostNumber: () => ask('getHostNumber'),
    getContact: (contactId: string) => ask('getContact', [contactId]),
    getAllContacts: () => ask('getAllContacts'),
    getAllChats: () => ask('getAllChats'),
    sendSeen: (chatId: string) => ask('sendSeen', [chatId]),
  };

  // Proxy: any uncovered method call becomes ask(methodName, args)
  return new Proxy(base as PluginClient, {
    get(target, prop: string) {
      if (prop in target) return target[prop as keyof PluginClient];
      if (prop === 'then') return undefined; // prevent Promise unwrapping
      return (...args: unknown[]) => ask(prop, args);
    },
  });
}

export async function createClient(options: CreateClientOptions): Promise<OpenWAClient> {
  const sessionId = options.sessionId ?? 'session';

  const logger = createLogger({
    component: 'core',
    sessionId,
  });
  const observability = options.observability ?? makeInMemoryObservability();

  const events = new HyperEmitter<OpenWAEventMap>({
    delimiter: '.',
    captureRejections: true,
    onError: (err) => logger.error('event_error', { error: err }),
    logger,
    debug: options.debug ?? false,
  });

  const experimentalLightpanda = options.driver.name === 'lightpanda'
    && options.lightpanda?.experimentalWhatsApp === true;
  if (options.driver.name !== 'puppeteer' && options.driver.name !== 'playwright' && !experimentalLightpanda) {
    throw new Error('Compact authentication requires Puppeteer, Playwright, or explicitly enabled experimental Lightpanda');
  }
  // Authentication always restores into a disposable browser profile.
  const resolvedUserDataDir = undefined;

  const session = new SessionManager({
    sessionId,
    events,
    logger,
    store: options.sessionStore,
  });

  const transport = new Transport({
    sessionId,
    sessionDataPath: options.sessionDataPath,
    sessionData: options.sessionData,
    skipSessionSave: options.skipSessionSave,
    s3Sync: options.s3Sync,
    sessionDataBucketAuth: options.sessionDataBucketAuth,
    sessionDataEncryptionKey: options.sessionDataEncryptionKey,
    sessionDataEncryptionKeyFile: options.sessionDataEncryptionKeyFile,
    driver: options.driver,
    events,
    logger,
    waWebUrl: options.waWebUrl,
    headless: options.headless,
    qrTimeoutMs: options.qrTimeoutMs,
    authTimeoutMs: options.authTimeoutMs,
    oorTimeoutMs: options.oorTimeoutMs,
    navigationTimeoutMs: options.navigationTimeoutMs,
    executablePath: options.executablePath,
    browser: options.browser,
    browserArgs: options.browserArgs,
    allowDangerousBrowserArgs: options.allowDangerousBrowserArgs,
    userDataDir: resolvedUserDataDir,
    linkCode: options.linkCode,
    qrMax: options.qrMax,
    ignoreNuke: options.ignoreNuke,
    logConsole: options.logConsole,
    logConsoleErrors: options.logConsoleErrors,
    blockCrashLogs: options.blockCrashLogs,
    blockAssets: options.blockAssets,
    safeMode: options.safeMode,
    watermark: options.watermark,
    lightpanda: options.lightpanda,
    patchConfig: options.patchConfig,
    licenseConfig: options.licenseConfig,
    calling: options.calling,
    callMediaHost: options.callMediaHost,
  });

  const pluginHost = new PluginHost(events, logger, options.hooks);
  const resourceScope = await SessionScope.make({
    observability,
    metricAttributes: { session: sessionId },
  });
  const detachGlobalEvents = attachGlobalEvents(events, sessionId, options.eventMode ?? true,
    error => logger.error('global_event_error', { error }));
  // Registered first, so Effect closes the bridge after the owned resources.
  await resourceScope.addFinalizer('global-events.detach', async () => {
    try { events.emit('core.stopped', {}); } finally {
      await detachGlobalEvents();
      await Effect.runPromise(events.close());
    }
  });
  await resourceScope.addFinalizer('transport.close', () => transport.close());
  await resourceScope.addFinalizer('plugins.dispose', () => pluginHost.dispose());
  if (options.executionSandbox) {
    await resourceScope.addFinalizer(
      'chat-sandbox.close',
      () => Effect.runPromise(options.executionSandbox!.close),
    );
  }
  if (options.memoryObservation) {
    await resourceScope.fork(options.memoryObservation(
      observability,
      () => transport.getBrowser()?.processId?.(),
    ).pipe(
      Effect.catchCause(() => Effect.never),
    ));
  }

  // Create the PluginClient proxy
  const pluginClient = createPluginClientProxy(transport, logger);
  const sandboxCapabilityHandlers: SandboxCapabilityHandlers = {
    sendText: (...args) => pluginClient.sendText(...args as Parameters<PluginClient['sendText']>),
    sendImage: (...args) => pluginClient.sendImage(...args as Parameters<PluginClient['sendImage']>),
    sendFile: (...args) => pluginClient.sendFile(...args as Parameters<PluginClient['sendFile']>),
    sendLocation: (...args) => pluginClient.sendLocation(...args as Parameters<PluginClient['sendLocation']>),
    sendLinkWithAutoPreview: (...args) => pluginClient.sendLinkWithAutoPreview(
      ...args as Parameters<PluginClient['sendLinkWithAutoPreview']>
    ),
    reply: (...args) => pluginClient.reply(...args as Parameters<PluginClient['reply']>),
    sendSeen: (...args) => pluginClient.sendSeen(...args as Parameters<PluginClient['sendSeen']>),
    getHostNumber: (...args) => pluginClient.getHostNumber(...args as Parameters<PluginClient['getHostNumber']>),
    getContact: (...args) => pluginClient.getContact(...args as Parameters<PluginClient['getContact']>),
    getAllContacts: (...args) => pluginClient.getAllContacts(...args as Parameters<PluginClient['getAllContacts']>),
    getAllChats: (...args) => pluginClient.getAllChats(...args as Parameters<PluginClient['getAllChats']>),
    ...options.sandboxCapabilities,
  };

  // Register directly-provided plugins
  try {
    if (options.plugins) {
      for (const plugin of options.plugins) {
        await pluginHost.register(plugin, {
          sessionId,
          client: pluginClient,
          pluginConfig: options.pluginConfig,
        });
      }
    }

    // Load and register config-referenced plugins
    if (options.pluginRefs?.length) {
      const loaded = await loadPlugins(options.pluginRefs, logger);
      for (const { plugin } of loaded) {
        await pluginHost.register(plugin, {
          sessionId,
          client: pluginClient,
          pluginConfig: options.pluginConfig,
        });
      }
    }
  } catch (error) {
    await resourceScope.close('plugin-failure');
    throw error;
  }

  const finalizationHooks = new Set<() => void | Promise<void>>();

  const registerFinalizationHook = (hook: () => void | Promise<void>) => {
    finalizationHooks.add(hook);
    return () => {
      finalizationHooks.delete(hook);
    };
  };

  const getReadinessSnapshot = () => session.getReadinessSnapshot(transport.getOperationalReadinessSnapshot());

  const refreshController = new SessionRefreshController({ transport, session, events, sessionId, logger });
  events.on('session.logout', () => refreshController.stop());
  let admissionAcquired = false;
  let recoveringSession = false;

  const client: OpenWAClient = {
    sessionId,
    events,
    logger,
    session,
    plugins: pluginHost,
    observability,
    config: {
      deleteSessionDataOnLogout: options.deleteSessionDataOnLogout,
      killClientOnLogout: options.killClientOnLogout,
      sessionDataPath: options.sessionDataPath,
      userDataDir: resolvedUserDataDir,
    },
    registerFinalizationHook,
    requestRefresh: options => refreshController.request(options),
    refresh: options => refreshController.refresh(options),
    getRefreshStatus: async () => refreshController.getStatus(),

    async start() {
      try {
      events.emit('core.starting', { config: {
        ...options, sessionDataEncryptionKey: undefined, sessionDataEncryptionKeyFile: undefined, pluginConfig: undefined,
      } });

      if (options.sessionAdmission && !admissionAcquired) {
        const memoryMb = Math.max(1, Math.round(options.estimatedMemoryMb ?? 512));
        const lease = await Effect.runPromise(options.sessionAdmission.acquire(memoryMb));
        await resourceScope.addFinalizer(
          'session-admission.release',
          () => Effect.runPromise(lease.release),
        );
        admissionAcquired = true;
      }

      session.resetRuntime();
      await session.setState('STARTING');

      const [, earlyLivePatchPreload, earlyLicensePreload] = await Promise.all([
        (async () => {
          if (!transport.getPage()) await transport.initialize();
          if (recoveringSession) await transport.waitForInjectableSession();
          else await transport.navigate();
        })(),
        transport.preloadLivePatchArtifacts(),
        transport.preloadLicenseArtifact({ sessionId, licenseKey: transport.getEffectiveLicenseKey() ?? options.licenseKey }),
      ]);

      await session.setState('AUTHENTICATING');

      // WhatsApp owns authentication. Helpers are optional while its QR is visible.
      await transport.injectWapi().catch(error => logger.warn('pre_auth_injection_deferred', { error }));
      const auth = await transport.waitForAuthentication();
      if (session.getState() === 'STOPPED') return;
      if (auth.outcome !== 'authenticated') {
        throw new Error(`Authentication did not finish: ${auth.outcome}`);
      }

      await transport.injectWapi({ reuseCachedPatches: false });
      const installation = await installDocumentRuntime(transport, earlyLivePatchPreload, async () => {
        const account = await transport.getSessionDebugInfo().catch(() => undefined);
        const key = transport.getEffectiveLicenseKey() ?? earlyLicensePreload.artifact?.key ?? options.licenseKey;
        return account?.hostNumber
          ? transport.preloadLicenseArtifact({ sessionId, licenseKey: key, sessionInfo: account })
          : earlyLicensePreload;
      }).catch(error => {
        logger.warn('runtime_installation_incomplete', { error });
        events.emit('error', { scope: 'runtime.installation', error: error instanceof Error ? error : new Error(String(error)), fatal: false });
        return undefined;
      });

      session.updateReadiness('runtimeUsable', 'satisfied', 'WhatsApp is showing the chat list');
      session.updateReadiness('patchLifecycle', installation?.livePatchApply.outcome === 'applied' ? 'satisfied' : 'non_blocking');
      session.updateReadiness('licenseLifecycle', installation?.licenseCheck.status === 'valid' ? 'satisfied' : 'non_blocking');
      for (const hook of [...finalizationHooks]) {
        await Promise.resolve().then(hook).catch(error => logger.warn('client_finalization_hook_failed', { error }));
      }
      if (session.getState() === 'STOPPED') return;
      transport.completeRuntimeReplacement();
      session.setFinalization('ready', 'WhatsApp authentication and runtime installation finished');

      await session.setState('READY');
      refreshController.resume();
      transport.enableRuntimeRecovery();

      events.emit('launch.client.finalize.after', {
        correlationId: 'bootstrap-client-finalize',
        ts: Date.now(),
        step: 'client_finalize',
        details: {
          state: 'READY',
          success: true,
          outcome: 'ready',
        },
      });

      events.emit('core.started', {});
      events.emit('client.ready', { sessionId });

      logger.info('client_ready', { sessionId });
      logger.info('bootstrap_finalized', {
        sessionId,
      });
      } catch (error) {
        if (recoveringSession) {
          if (session.getState() !== 'STOPPED') {
            session.setFinalization('failed', 'Session reauthentication could not finish');
            await session.setState('DISCONNECTED', 'session_reauthentication_failed');
          }
          throw error;
        }
        try {
          await resourceScope.close('startup-failure');
        } catch (cleanupError) {
          logger.error('startup_cleanup_failed', {
            error: cleanupError,
          });
        }
        throw error;
      }
    },

    async stop(reason?: string) {
      refreshController.stop();
      events.emit('core.stopping', { reason });

      await session.setState('STOPPED', reason);
      const supportedReasons = new Set<SessionFinalizerReason>([
        'auth-timeout',
        'browser-crash',
        'failure',
        'interruption',
        'normal-stop',
        'plugin-failure',
        'signal',
        'startup-failure',
      ]);
      const finalizerReason: SessionFinalizerReason = supportedReasons.has(reason as SessionFinalizerReason)
        ? reason as SessionFinalizerReason
        : 'normal-stop';
      await resourceScope.close(finalizerReason);

      logger.info('client_stopped', { sessionId, reason });
    },

    getState() {
      return session.getState();
    },

    getReadiness() {
      return getReadinessSnapshot();
    },

    getTransport() {
      return transport;
    },

    async screenshot() {
      if (hasCapabilitySubject(options.driver)) {
        requireCapability(options.driver, 'screenshot');
      }
      const page = transport.getPage();
      if (!page || page.isClosed()) return null;
      return page.screenshot({ fullPage: true });
    },

    async evaluateScript<T = unknown>(script: string): Promise<T | null> {
      const page = transport.getPage();
      if (!page || page.isClosed()) return null;
      return transport.evaluateScript<T>(script);
    },

    async executeInChatSandbox<T = unknown>(chatId: string, source: string, input?: unknown): Promise<T> {
      if (!options.executionSandbox || !options.sandboxPolicy?.chats) {
        throw new Error('Chat sandboxing is disabled. Enable sandboxChats and configure an execution adapter.');
      }
      return Effect.runPromise(options.executionSandbox.execute({
        chatId,
        source,
        input,
        policy: options.sandboxPolicy,
        capabilityHandlers: sandboxCapabilityHandlers,
      })) as Promise<T>;
    },

    async closeChatSandbox(chatId: string): Promise<void> {
      if (!options.executionSandbox) return;
      await Effect.runPromise(options.executionSandbox.closeChat(chatId));
    },

    async getRuntimeMetrics(): Promise<Readonly<Record<string, number>>> {
      return Effect.runPromise(observability.snapshot);
    },

    async getRuntimeCauses() {
      return Effect.runPromise(observability.causes);
    },
  };

  transport.setSessionRecoveryHandler(async reason => {
    if (session.getState() === 'STOPPED' || options.killClientOnLogout) return;
    recoveringSession = true;
    refreshController.stop();
    session.resetRuntime();
    await session.setState('AUTHENTICATING', reason);
    try {
      if (session.getState() !== 'STOPPED') await client.start();
    } catch (error) {
      if (session.getState() !== 'STOPPED') {
        session.setFinalization('failed', 'Session reauthentication could not finish');
        await session.setState('DISCONNECTED', 'session_reauthentication_failed');
      }
      throw error;
    } finally {
      recoveringSession = false;
    }
  });

  return client;
}
