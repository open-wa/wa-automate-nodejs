import { HyperEmitter } from '@open-wa/hyperemitter';
import { createLogger, Logger } from '@open-wa/logger';
import type { IDriver, LightpandaOptions } from '@open-wa/driver-interface';
import { requireCapability, type CapabilitySubject } from '@open-wa/driver-interface';
import { OpenWAEventMap, STATE } from './events/eventMap.js';
import { PluginHost, loadPlugins } from './plugins/index.js';
import type { Plugin, PluginClient } from '@open-wa/plugin-sdk';
import {
  SessionManager,
  SessionStore,
  type SessionReadinessSnapshot,
  type SessionValidationStage,
} from './sessionmanager/index.js';
import { Transport } from './transport/index.js';
import type {
  LicenseKeyResolver,
  PatchFetchConfig,
  LicenseServerConfig,
  RuntimeValidationFailureReason,
} from './transport/index.js';

export interface CreateClientOptions {
  sessionId?: string;
  driver: IDriver;
  deleteSessionDataOnLogout?: boolean;
  killClientOnLogout?: boolean;
  sessionDataPath?: string;

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

  sessionStore?: SessionStore;
  debug?: boolean;
  waWebUrl?: string;
  headless?: boolean;
  qrTimeoutMs?: number;
  authTimeoutMs?: number;
  oorTimeoutMs?: number;
  navigationTimeoutMs?: number;
  executablePath?: string;
  watermark?: boolean | { text?: string; color?: string; background?: string; };
  browserArgs?: string[];
  userDataDir?: string;
  /**
   * When true, prevents auto-derivation of userDataDir from sessionId.
   * The browser launches with an ephemeral temp profile discarded on exit.
   * Useful for testing without leaving `_IGNORE_` directories behind.
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
   * Controls patch endpoints, caching, and fallback behavior.
   */
  patchConfig?: PatchFetchConfig;

  /**
   * Configuration for remote license validation via funcs.openwa.dev.
   * Controls the license check endpoint and offline mode.
   */
  licenseConfig?: LicenseServerConfig;
}

export interface OpenWAClient {
  readonly sessionId: string;
  readonly events: HyperEmitter<OpenWAEventMap>;
  readonly logger: Logger;
  readonly session: SessionManager;
  readonly plugins: PluginHost;
  readonly config: Readonly<Pick<CreateClientOptions, 'deleteSessionDataOnLogout' | 'killClientOnLogout' | 'sessionDataPath' | 'userDataDir'>>;

  registerFinalizationHook(hook: () => void | Promise<void>): () => void;
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
  getState(): STATE;
  getReadiness(): SessionReadinessSnapshot;
  getTransport(): Transport;
  screenshot(): Promise<Uint8Array | null>;
  evaluateScript<T = unknown>(script: string): Promise<T | null>;
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
    const result = await page.evaluateScript<T>(
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

  const events = new HyperEmitter<OpenWAEventMap>({
    delimiter: '.',
    captureRejections: true,
    onError: (err) => logger.error('event_error', { error: err }),
    logger,
    debug: options.debug ?? false,
  });

  // ── userDataDir Resolution ────────────────────────────────────────────────
  // Matches v4 behavior: auto-derive _IGNORE_{sessionId} unless explicitly
  // set or ephemeral mode is enabled.
  let resolvedUserDataDir: string | undefined;

  if (options.ephemeral) {
    // Ephemeral mode: intentionally use no persistent profile
    resolvedUserDataDir = undefined;
    logger.info('user_data_dir_resolved', {
      mode: 'ephemeral',
      userDataDir: null,
      detail: 'Ephemeral mode enabled — browser will use a disposable temp profile with no session persistence',
    });
  } else if (options.userDataDir) {
    // Explicitly provided by caller
    resolvedUserDataDir = options.userDataDir;
    logger.info('user_data_dir_resolved', {
      mode: 'explicit',
      userDataDir: resolvedUserDataDir,
      detail: 'Using explicitly configured userDataDir for session persistence',
    });
  } else {
    // Auto-derive from sessionId (v4 parity)
    const basePath = options.sessionDataPath || '.';
    resolvedUserDataDir = `${basePath}/_IGNORE_${sessionId}`;
    logger.info('user_data_dir_resolved', {
      mode: 'derived',
      userDataDir: resolvedUserDataDir,
      sessionId,
      detail: `Auto-derived userDataDir from sessionId for session persistence (set ephemeral=true to disable)`,
    });
  }

  const session = new SessionManager({
    sessionId,
    events,
    logger,
    store: options.sessionStore,
  });

  const transport = new Transport({
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
    browserArgs: options.browserArgs,
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
  });

  const pluginHost = new PluginHost(events, logger);

  // Create the PluginClient proxy
  const pluginClient = createPluginClientProxy(transport, logger);

  // Register directly-provided plugins
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

  const finalizationHooks = new Set<() => void | Promise<void>>();

  const registerFinalizationHook = (hook: () => void | Promise<void>) => {
    finalizationHooks.add(hook);
    return () => {
      finalizationHooks.delete(hook);
    };
  };

  const runFinalizationHooks = async () => {
    for (const hook of [...finalizationHooks]) {
      await hook();
    }
  };

  const getReadinessSnapshot = () => session.getReadinessSnapshot(transport.getOperationalReadinessSnapshot());

  const client: OpenWAClient = {
    sessionId,
    events,
    logger,
    session,
    plugins: pluginHost,
    config: {
      deleteSessionDataOnLogout: options.deleteSessionDataOnLogout,
      killClientOnLogout: options.killClientOnLogout,
      sessionDataPath: options.sessionDataPath,
      userDataDir: resolvedUserDataDir,
    },
    registerFinalizationHook,

    async start() {
      events.emit('core.starting', { config: options });

      session.resetRuntime();
      await session.setState('STARTING');

      const markReadinessFailure = (scope: string, detail: string) => {
        if (scope.includes('license')) {
          session.updateReadiness('licenseLifecycle', 'failed', detail);
          return;
        }

        if (scope.includes('patch')) {
          session.updateReadiness('patchLifecycle', 'failed', detail);
          return;
        }

        if (scope.includes('finalization')) {
          session.setFinalization('failed', detail);
          return;
        }

        if (scope.includes('auth')) {
          session.setFinalization('failed', detail);
          return;
        }

        session.updateReadiness('runtimeUsable', 'failed', detail);
      };

      const emitFatalBootstrapError = async (scope: string, error: unknown) => {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        markReadinessFailure(scope, normalizedError.message);
        events.emit('error', {
          scope,
          error: normalizedError,
          fatal: true,
        });
        await session.setState('DISCONNECTED', scope);
        throw normalizedError;
      };

      const emitFailedFinalization = (detail: string) => {
        session.setFinalization('failed', detail);
        events.emit('launch.client.finalize.after', {
          correlationId: 'bootstrap-client-finalize',
          ts: Date.now(),
          step: 'client_finalize',
          details: {
            state: session.getState(),
            success: false,
            outcome: 'failed',
            detail,
          },
        });
      };

      const runValidationStage = async (
        stage: SessionValidationStage,
        options: {
          correlationId: string;
          allowRepair: boolean;
          invalidScope: string;
          deferFailure?: (result: Awaited<ReturnType<Transport['validateRuntimeUsability']>>) => boolean;
        }
      ) => {
        const validateAttempt = async (attempt: number, repaired: boolean) => {
          events.emit('launch.session.validityCheck.before', {
            correlationId: options.correlationId,
            attempt,
            ts: Date.now(),
            step: 'session_validity_check',
            details: { phase: stage },
          });

          const result = await transport.validateRuntimeUsability(stage);

          session.recordValidation({
            stage,
            attempt,
            usable: result.usable,
            repairable: result.repairable,
            repaired,
            checkedAt: Date.now(),
            failureReason: result.failureReason,
            capability: {
              hasRuntime: result.hasRuntime,
              hasStoreMsg: result.hasStoreMsg,
              sessionLoaded: result.sessionLoaded,
            },
          });

          events.emit('launch.session.validityCheck.after', {
            correlationId: options.correlationId,
            attempt,
            ts: Date.now(),
            step: 'session_validity_check',
            details: {
              phase: stage,
              valid: result.usable,
              usable: result.usable,
              hasRuntime: result.hasRuntime,
              hasStore: result.hasStoreMsg,
              hasMsg: result.hasStoreMsg,
              sessionLoaded: result.sessionLoaded,
              bridgeReady: result.bridgeReady,
              requiredMethods: result.requiredMethods,
              missingMethods: result.missingMethods,
              repairable: result.repairable,
              repaired,
              failureReason: result.failureReason,
            },
          });

          return result;
        };

        const firstResult = await validateAttempt(1, false);
        if (firstResult.usable) {
          return firstResult;
        }

        if (options.deferFailure?.(firstResult)) {
          return firstResult;
        }

        if (!options.allowRepair || !firstResult.repairable) {
          return emitFatalBootstrapError(
            options.invalidScope,
            new Error(`Session validation failed during ${stage}: ${firstResult.failureReason ?? 'unknown_failure'}`)
          );
        }

        const repairReason: RuntimeValidationFailureReason = firstResult.failureReason ?? 'runtime_missing';

        events.emit('launch.session.invalid.retry', {
          correlationId: options.correlationId,
          attempt: 2,
          ts: Date.now(),
          step: 'session_invalid_retry',
          details: { reason: repairReason },
        });
        events.emit('session.stale.detected', {
          correlationId: options.correlationId,
          attempt: 1,
          ts: Date.now(),
          step: 'session_stale_detected',
          details: { reason: repairReason },
        });
        events.emit('session.reinject.detected', {
          correlationId: options.correlationId,
          attempt: 1,
          ts: Date.now(),
          step: 'session_reinject_detected',
          details: { reason: repairReason },
        });
        events.emit('session.reinject.before', {
          correlationId: options.correlationId,
          attempt: 2,
          ts: Date.now(),
          step: 'session_reinject',
          details: { reason: repairReason },
        });

        try {
          await transport.repairRuntimeIntegrity(repairReason);
        } catch (error) {
          session.recordRepair({
            stage,
            attempt: 2,
            reason: repairReason,
            success: false,
            at: Date.now(),
          });
          events.emit('session.reinject.after', {
            correlationId: options.correlationId,
            attempt: 2,
            ts: Date.now(),
            step: 'session_reinject',
            details: { success: false },
          });
          return emitFatalBootstrapError(options.invalidScope, error);
        }

        const repairedResult = await validateAttempt(2, true);
        session.recordRepair({
          stage,
          attempt: 2,
          reason: repairReason,
          success: repairedResult.usable,
          at: Date.now(),
        });

        events.emit('session.reinject.after', {
          correlationId: options.correlationId,
          attempt: 2,
          ts: Date.now(),
          step: 'session_reinject',
          details: { success: repairedResult.usable },
        });

        if (!repairedResult.usable) {
          return emitFatalBootstrapError(
            options.invalidScope,
            new Error(`Session validation failed after repair during ${stage}: ${repairedResult.failureReason ?? repairReason}`)
          );
        }

        return repairedResult;
      };

      const shouldDeferPreAuthRuntimeIntegrity = (
        result: Awaited<ReturnType<Transport['validateRuntimeUsability']>>
      ) => result.failureReason === 'required_method_missing' && !result.sessionLoaded;

      await transport.initialize();
      await transport.navigate();

      await session.setState('AUTHENTICATING');

      try {
        await transport.injectWapi();
      } catch (error) {
        return emitFatalBootstrapError('bootstrap.injection', error);
      }

      const attemptingReauth = await transport.detectAttemptingReauth().catch(() => false);
      logger.info('launch_auth_mode_detected', {
        attemptingReauth,
      });

      const runtimeCapability = await runValidationStage('post_injection', {
        correlationId: 'bootstrap-runtime-validation',
        allowRepair: true,
        invalidScope: 'bootstrap.injection.capability',
        deferFailure: shouldDeferPreAuthRuntimeIntegrity,
      });

      const deferredPreAuthRuntimeIntegrity = !runtimeCapability.usable;

      if (deferredPreAuthRuntimeIntegrity) {
        session.updateReadiness(
          'runtimeUsable',
          'pending',
          'Pre-auth runtime integrity is incomplete before authentication; strict runtime validation is deferred until the authenticated runtime settles'
        );

        logger.warn('runtime_activation_deferred', {
          validationPhase: 'pre_auth_post_injection',
          deferredReason: runtimeCapability.failureReason,
          sessionLoaded: runtimeCapability.sessionLoaded,
          missingMethods: runtimeCapability.missingMethods,
          requiredMethods: runtimeCapability.requiredMethods,
          nextGate: 'post_auth_post_injection',
        });
      } else {
        session.updateReadiness(
          'runtimeUsable',
          'satisfied',
          'Runtime injection and post-injection validation proved usable capability'
        );

        logger.info('runtime_activation_ready', {
          ...runtimeCapability,
          validationPhase: 'pre_auth_post_injection',
        });
      }

      logger.info('bootstrap_sequence_started', {
        sessionId,
        usePatch: !!options.patchConfig,
      });

      const authResult = await transport.waitForAuthentication({ attemptingReauth });
      if (authResult.outcome === 'qr_timeout') {
        emitFailedFinalization('QR scan took too long. Increase qrTimeout or set qrTimeout=0 to wait forever.');
        return emitFatalBootstrapError(
          'bootstrap.auth.qr_timeout',
          new Error('QR scan took too long. Increase qrTimeout or set qrTimeout=0 to wait forever.')
        );
      }

      if (authResult.outcome === 'auth_timeout') {
        emitFailedFinalization('Authentication timed out. Increase authTimeout or set authTimeout=0 to wait forever.');
        return emitFatalBootstrapError(
          'bootstrap.auth.timeout',
          new Error('Authentication timed out. Increase authTimeout or set authTimeout=0 to wait forever.')
        );
      }

      if (authResult.outcome === 'phone_out_of_reach') {
        emitFailedFinalization('Authentication timed out because the host phone is out of reach. Open WhatsApp on the phone and try again.');
        return emitFatalBootstrapError(
          'bootstrap.auth.phone_out_of_reach',
          new Error('Authentication timed out because the host phone is out of reach. Open WhatsApp on the phone and try again.')
        );
      }

      if (authResult.outcome === 'invalid_session') {
        emitFailedFinalization('Session data most likely expired due to manual host account logout. Re-authenticate this session or set ignoreNuke to bypass the explicit invalid-session classification.');
        return emitFatalBootstrapError(
          'bootstrap.auth.invalid_session',
          new Error('Session data most likely expired due to manual host account logout. Re-authenticate this session or set ignoreNuke to bypass the explicit invalid-session classification.')
        );
      }

      if (authResult.outcome === 'qr_max') {
        emitFailedFinalization('Authentication aborted because the configured QR/link-code limit was reached before login completed. Increase qrMax or remove it to keep waiting.');
        return emitFatalBootstrapError(
          'bootstrap.auth.qr_max',
          new Error('Authentication aborted because the configured QR/link-code limit was reached before login completed. Increase qrMax or remove it to keep waiting.')
        );
      }

      const postAuthRuntime = await transport.reconcilePostAuthRuntime({
        freshAuth: !attemptingReauth,
      });

      if (!postAuthRuntime.ripeSessionLoaded) {
        emitFailedFinalization('Authenticated runtime did not reach a ripe session before post-auth reinjection/gating completed.');
        return emitFatalBootstrapError(
          'bootstrap.auth.ripe_session_timeout',
          new Error('Authenticated runtime did not reach a ripe session before post-auth reinjection/gating completed.')
        );
      }

      logger.info('post_auth_runtime_reconciled', {
        path: postAuthRuntime.path,
        reinjected: postAuthRuntime.reinjected,
        hasRuntime: postAuthRuntime.hasRuntime,
        hasStoreMsg: postAuthRuntime.hasStoreMsg,
        sessionLoaded: postAuthRuntime.sessionLoaded,
        ripeSessionLoaded: postAuthRuntime.ripeSessionLoaded,
      });

      // Bridge bindings registration is deferred to AFTER live patches complete.
      // The replacement observer (OpenWA_RuntimeReplacementDetected) must not fire
      // before live patches are applied, and ensureRuntimeBridge() must not wire
      // onStateChanged to an unpatched WAPI.
      // See Phase 1 registration below, after live_patch_sequence_complete.

      // Capability-only validation: verify runtime/store/session are alive but
      // do NOT check bridge integrity — the bridge is not yet wired to WAPI.
      // Using validateRuntimeCapabilityOnly avoids probeBrokenMethodIntegrity()
      // which would prematurely call ensureRuntimeBridge() and wire unpatched WAPI.
      const postAuthRuntimeCapability = await transport.validateRuntimeCapabilityOnly('post_injection');

      session.recordValidation({
        stage: 'post_injection',
        attempt: 1,
        usable: postAuthRuntimeCapability.usable,
        repairable: postAuthRuntimeCapability.repairable,
        repaired: false,
        checkedAt: Date.now(),
        failureReason: postAuthRuntimeCapability.failureReason,
        capability: {
          hasRuntime: postAuthRuntimeCapability.hasRuntime,
          hasStoreMsg: postAuthRuntimeCapability.hasStoreMsg,
          sessionLoaded: postAuthRuntimeCapability.sessionLoaded,
        },
      });

      if (!postAuthRuntimeCapability.usable) {
        // Attempt repair: reinject the runtime
        try {
          await transport.repairRuntimeIntegrity(postAuthRuntimeCapability.failureReason ?? 'runtime_missing');
        } catch (repairError) {
          return emitFatalBootstrapError('bootstrap.auth.runtime_validation', repairError);
        }

        // Re-validate after repair (capability-only — bridge still not wired)
        const revalidated = await transport.validateRuntimeCapabilityOnly('post_injection');
        session.recordValidation({
          stage: 'post_injection',
          attempt: 2,
          usable: revalidated.usable,
          repairable: revalidated.repairable,
          repaired: true,
          checkedAt: Date.now(),
          failureReason: revalidated.failureReason,
          capability: {
            hasRuntime: revalidated.hasRuntime,
            hasStoreMsg: revalidated.hasStoreMsg,
            sessionLoaded: revalidated.sessionLoaded,
          },
        });

        if (!revalidated.usable) {
          return emitFatalBootstrapError(
            'bootstrap.auth.runtime_validation',
            new Error(`Post-injection capability validation failed after repair: ${revalidated.failureReason ?? 'unknown_failure'}`)
          );
        }
      }

      // ── Store Settle Gate (Option C) ──────────────
      // Wait for window.Store.Msg to settle before marking readiness satisfied.
      // This matches legacy v4 robustness and prevents store_missing failures at post_patch.
      let storeMsgAvailable = postAuthRuntimeCapability.hasStoreMsg;
      if (!storeMsgAvailable) {
        logger.info('store_settle_gate_started', {
          timeoutMs: 15000,
          reason: 'Store.Msg missing after post-auth validation',
        });
        storeMsgAvailable = await transport.waitForStoreMsg(15000);
      }

      if (!storeMsgAvailable) {
        const storeKeys = await transport.getStoreKeys().catch(() => []);
        logger.error('store_settle_gate_timeout', {
          availableKeys: storeKeys,
          message: 'Timed out waiting for Store.Msg to settle.',
        });
        return emitFatalBootstrapError(
          'bootstrap.store_settle',
          new Error(`Store.Msg not available after 15s store-settle window. Available Store keys: ${storeKeys.join(', ')}`)
        );
      } else {
        logger.info('store_settle_gate_satisfied');
      }

      session.updateReadiness(
        'runtimeUsable',
        'satisfied',
        deferredPreAuthRuntimeIntegrity
          ? 'Authenticated runtime validation proved usable capability after the deferred pre-auth integrity check and store-settle gate'
          : 'Authenticated runtime validation proved usable capability after runtime bridge registration and store-settle gate'
      );

      logger.info('runtime_activation_ready', {
        ...postAuthRuntimeCapability,
        validationPhase: 'post_auth_post_injection',
        deferredFromPreAuth: deferredPreAuthRuntimeIntegrity,
      });

      // ── Session Info Extraction (post-auth, pre-overlay) ──────────────
      // Extract debug info from the authenticated page for remote overlay requests.
      // This mirrors the legacy sequence: auth → session info → patch → integrity → license.
      let sessionDebugInfo;
      try {
        sessionDebugInfo = await transport.getSessionDebugInfo();
        logger.info('session_debug_info_extracted', {
          hostNumber: sessionDebugInfo.hostNumber ? '***' + sessionDebugInfo.hostNumber.slice(-4) : 'unknown',
          waVersion: sessionDebugInfo.WA_VERSION,
        });
      } catch (debugInfoError) {
        const dbgMsg = debugInfoError instanceof Error ? debugInfoError.message : String(debugInfoError);
        logger.warn('session_debug_info_extraction_failed', { error: dbgMsg });
        // Continue without debug info — preload methods will fall back gracefully
      }

      const livePatchPreloadPromise = transport.preloadLivePatchArtifacts({ sessionInfo: sessionDebugInfo });
      const licensePreloadPromise = transport.preloadLicenseArtifact({
        sessionId,
        licenseKey: options.licenseKey,
        sessionInfo: sessionDebugInfo,
      });

      const livePatchPreload = await livePatchPreloadPromise.catch((error) =>
        emitFatalBootstrapError('bootstrap.live_patch.preload', error)
      );
      logger.info('live_patch_artifacts_preloaded', {
        outcome: livePatchPreload.outcome,
        source: livePatchPreload.source,
        tag: livePatchPreload.tag,
        artifactCount: livePatchPreload.artifacts.length,
      });

      const livePatchApply = await transport.applyLivePatchArtifacts(livePatchPreload).catch((error) =>
        emitFatalBootstrapError('bootstrap.live_patch.apply', error)
      );

      if (livePatchApply.blockingFailure) {
        const blockingPatch = livePatchApply.results.find((result) => result.required && result.outcome !== 'applied');
        await emitFatalBootstrapError(
          'bootstrap.live_patch.lifecycle',
          new Error(blockingPatch?.detail ?? 'Required live patch lifecycle did not complete successfully')
        );
      }

      /**
       * Phase 1 (post-live-patch): Register Node-side persistent bindings.
       * This MUST happen after live patches are applied because the replacement
       * observer (OpenWA_RuntimeReplacementDetected) would trigger recovery
       * that overwrites the live-patched WAPI.
       *
       * NOTE: This only registers Node-side bindings (exposeFunction etc.).
       * The actual bridge wiring (ensureRuntimeBridge → onStateChanged, etc.)
       * is deferred to Phase 2 (activateRuntimeEventBridge) which runs AFTER
       * init patch, matching the v4 order: patches → license → init → loaded.
       */
      try {
        await transport.registerRuntimeEventBridgeBindings();
      } catch (error) {
        return emitFatalBootstrapError('bootstrap.runtime_bridge_registration', error);
      }

      // ── Post-patch capability validation ──────────────
      // Check runtime/store/session capability ONLY — do NOT wire the bridge yet.
      // In v4, event listeners (onStateChanged etc.) are wired in client.loaded()
      // which runs AFTER init patch. The full bridge wiring happens at Phase 2
      // (activateRuntimeEventBridge) below, after init patch has been applied.
      // Using validateRuntimeCapabilityOnly prevents ensureRuntimeBridge() from
      // prematurely calling onStateChanged before Store.State is ready.
      const postPatchCapability = await transport.validateRuntimeCapabilityOnly('post_patch');

      session.recordValidation({
        stage: 'post_patch',
        attempt: 1,
        usable: postPatchCapability.usable,
        repairable: postPatchCapability.repairable,
        repaired: false,
        checkedAt: Date.now(),
        failureReason: postPatchCapability.failureReason,
        capability: {
          hasRuntime: postPatchCapability.hasRuntime,
          hasStoreMsg: postPatchCapability.hasStoreMsg,
          sessionLoaded: postPatchCapability.sessionLoaded,
        },
      });

      if (!postPatchCapability.usable) {
        return emitFatalBootstrapError(
          'bootstrap.patch.integrity',
          new Error(`Post-patch capability validation failed: ${postPatchCapability.failureReason ?? 'unknown_failure'}`)
        );
      }

      logger.info('post_patch_runtime_validated', {
        ...postPatchCapability,
        validationPhase: 'post_patch_pre_license',
      });

      events.emit('launch.patch.integrity.after', {
        correlationId: 'bootstrap-post-patch-integrity',
        ts: Date.now(),
        step: 'patch_integrity',
        details: {
          phase: 'post_patch',
          valid: postPatchCapability.usable,
          usable: postPatchCapability.usable,
          failureReason: postPatchCapability.failureReason,
        },
      });

      const licensePreload = await licensePreloadPromise.catch((error) =>
        emitFatalBootstrapError('bootstrap.license.preload', error)
      );
      const licenseCheck = await transport.checkLicenseArtifact(licensePreload).catch((error) =>
        emitFatalBootstrapError('bootstrap.license.check', error)
      );

      if (licenseCheck.status === 'missing') {
        session.updateReadiness(
          'licenseLifecycle',
          'non_blocking',
          licenseCheck.detail ?? 'License metadata lifecycle classified as explicitly non-blocking'
        );
        logger.info('license_lifecycle_complete', {
          status: licenseCheck.status,
          detail: licenseCheck.detail,
          readinessImpact: 'allow_ready',
        });
      } else if (licenseCheck.status === 'invalid' || licenseCheck.status === 'expired' || licenseCheck.blockingFailure) {
        await emitFatalBootstrapError(
          'bootstrap.license.lifecycle',
          new Error(licenseCheck.detail ?? `License lifecycle blocked readiness with status: ${licenseCheck.status}`)
        );
      } else {
        const licenseApply = await transport.applyLicenseArtifact(licenseCheck).catch((error) =>
          emitFatalBootstrapError('bootstrap.license.apply', error)
        );

        if (licenseApply.blockingFailure || !licenseApply.applied) {
          await emitFatalBootstrapError(
            'bootstrap.license.apply',
            new Error(licenseApply.detail ?? 'License lifecycle did not complete successfully')
          );
        }

        const readinessState = licenseApply.status === 'valid' ? 'satisfied' : 'non_blocking';
        const readinessDetail = licenseApply.status === 'valid'
          ? licenseApply.detail ?? 'License lifecycle completed with a server-confirmed unlock'
          : licenseApply.detail ?? 'License lifecycle completed with metadata-only fallback; capability was not server-confirmed';

        session.updateReadiness(
          'licenseLifecycle',
          readinessState,
          readinessDetail
        );

        logger.info('license_lifecycle_complete', {
          status: licenseApply.status,
          applied: licenseApply.applied,
          keyType: licenseApply.keyType,
          readinessImpact: readinessState === 'satisfied' ? 'satisfy_requirement' : 'allow_ready_without_server_unlock',
        });
      }

      const initPatchApply = await transport.applyDeferredInitPatchArtifact().catch((error) =>
        emitFatalBootstrapError('bootstrap.patch.init', error)
      );

      if (initPatchApply.blockingFailure) {
        const blockingInitPatch = initPatchApply.results.find((result) => result.required && result.outcome !== 'applied');
        await emitFatalBootstrapError(
          'bootstrap.patch.lifecycle',
          new Error(blockingInitPatch?.detail ?? 'Deferred init patch did not complete successfully')
        );
      }

      // ── Phase 2: Activate runtime event bridge (post-init-patch) ──────────────
      // Wire listeners to WAPI methods (onStateChanged, onAnyMessage, etc.).
      // This is the FIRST bridge wiring point — post_patch validation above only
      // checks capability, not bridge integrity. This matches the v4 order where
      // event listeners are wired in client.loaded() AFTER init patch.
      try {
        await transport.activateRuntimeEventBridge();
      } catch (error) {
        return emitFatalBootstrapError('bootstrap.runtime_bridge_activation', error);
      }

      const combinedPatchResults = [...livePatchApply.results, ...initPatchApply.results];
      const combinedPatchApplied = [...livePatchApply.applied, ...initPatchApply.applied];
      const combinedPatchOutcome = livePatchApply.outcome === 'failed' || initPatchApply.outcome === 'failed'
        ? 'failed'
        : combinedPatchApplied.length > 0
          ? 'applied'
          : 'skipped';

      session.updateReadiness(
        'patchLifecycle',
        combinedPatchOutcome === 'applied' ? 'satisfied' : 'non_blocking',
        combinedPatchOutcome === 'applied'
          ? 'Patch lifecycle completed successfully, including deferred init patch finalization'
          : `Patch lifecycle completed with non-blocking outcome: ${combinedPatchOutcome}`
      );

      logger.info('patch_lifecycle_complete', {
        outcome: combinedPatchOutcome,
        applied: combinedPatchApplied,
        results: combinedPatchResults,
      });

      events.emit('launch.client.finalize.before', {
        correlationId: 'bootstrap-client-finalize',
        ts: Date.now(),
        step: 'client_finalize',
        details: {
          validationStage: 'loaded_equivalent',
          patchOutcome: combinedPatchOutcome,
          licenseStatus: licenseCheck.status,
        },
      });

      session.setFinalization('pending', 'post-overlay validation in progress');

      try {
        const finalValidation = await runValidationStage('post_overlay', {
          correlationId: 'bootstrap-post-overlay-validation',
          allowRepair: true,
          invalidScope: 'bootstrap.finalization.validation',
        });

        logger.info('session_finalization_validated', { ...finalValidation });

        if (finalizationHooks.size > 0) {
          session.setFinalization('pending', 'Loaded-equivalent client finalization hooks are running');
          await runFinalizationHooks();
        }

        session.setFinalization('pending', 'Waiting for finalized operational readiness truth to settle');
        const operationalReadiness = await transport.waitForOperationalReadiness();

        session.setFinalization('ready', 'Post-overlay validation, client finalization hooks, and operational readiness truth verification completed');

        const finalizedReadiness = session.getReadinessSnapshot(operationalReadiness);

        if (!finalizedReadiness.exposureSafe) {
          const pendingTruth = finalizedReadiness.pending.join(', ');
          const detail = pendingTruth.length > 0
            ? `Finalized readiness truth is still pending: ${pendingTruth}`
            : 'Finalized readiness truth verification failed unexpectedly';
          return emitFatalBootstrapError('bootstrap.finalization.readiness_truth', new Error(detail));
        }
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        emitFailedFinalization(normalizedError.message);
        throw normalizedError;
      }

      await session.setState('READY');

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
    },

    async stop(reason?: string) {
      events.emit('core.stopping', { reason });

      await session.setState('STOPPED', reason);
      await pluginHost.dispose();
      await transport.close();

      events.emit('core.stopped', {});

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
      return page.evaluateScript<T>(script);
    },
  };

  return client;
}
