import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type {
  DisposableHandle,
  IConsoleMessage,
  IDriver,
  IBrowser,
  IPage,
  IRequest,
  WaitForFunctionOptions,
} from '@open-wa/driver-interface';
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { OpenWAEventMap, STATE } from '../events/eventMap.js';
import { fetchPatches, validateLicense } from './httpClient.js';
import { InjectionController, type GenerationSnapshot } from './InjectionController.js';
import { getProgObserverScript, injectInitPatch } from './initPatchScripts.js';
import { getRuntimeListenerSurfaceEntry, runtimeListenerSurface } from './runtimeListenerSurface.js';
import { auditWapiHelperAssetRequirements } from './ScriptLoader.js';
import { chromiumConfig } from './browserConfig.js';

export interface PatchFetchConfig {
  patchesUrl?: string;
  /** Use GitHub raw patches as the primary source instead of the default CDN. */
  ghPatch?: boolean;
  /** @deprecated Prefer `ghPatch`. When false, disables the CDN -> GitHub fallback path. */
  ghPatchFallback?: boolean;
  cachedPatch?: boolean;
}

export interface LicenseServerConfig {
  licenseCheckUrl?: string;
  offlineLicenseMode?: boolean;
}

export interface SessionDebugInfo {
  WA_VERSION: string;
  WA_AUTOMATE_VERSION: string;
  hostNumber: string;
  BROWSER_VERSION?: string;
  PAGE_UA?: string;
  OS?: string;
  NUM_HASH?: string;
}

export interface TransportOptions {
  driver: IDriver;
  events: HyperEmitter<OpenWAEventMap>;
  logger: Logger;
  waWebUrl?: string;
  headless?: boolean;
  qrTimeoutMs?: number;
  authTimeoutMs?: number;
  oorTimeoutMs?: number;
  qrPollingMs?: number;
  navigationTimeoutMs?: number;
  executablePath?: string;
  browserArgs?: string[];
  userDataDir?: string;
  linkCode?: string;
  qrMax?: number;
  ignoreNuke?: boolean;
  logConsole?: boolean;
  logConsoleErrors?: boolean;
  blockCrashLogs?: boolean;
  blockAssets?: boolean;
  safeMode?: boolean;
  patchConfig?: PatchFetchConfig;
  licenseConfig?: LicenseServerConfig;
}

const CRASH_LOG_URL_FRAGMENTS = [
  'https://dit.whatsapp.net/deidentified_telemetry',
  'https://crashlogs.whatsapp.net/',
];

const BLOCKED_ASSET_RESOURCE_TYPES = new Set(['image', 'stylesheet', 'font']);

/** JavaScript snippet to extract QR data from the WA Web page */
const QR_CHECK_SCRIPT = `document.querySelector("canvas[aria-label]")?.parentElement?.getAttribute("data-ref") || null`;
const QR_SELECTOR_PRIMARY = "canvas[aria-label='Scan this QR code to link a device!']";
const QR_SELECTOR_FALLBACK = 'canvas[aria-label]';
const PRE_API_HELPER_READY_CHECK_SCRIPT = `Boolean(!['jsSHA','axios','QRCode','Base64','objectHash'].find(x=>!window[x]))`;

const WAPI_RUNTIME_CHECK_SCRIPT = '!!window.WAPI';
const STORE_MSG_CHECK_SCRIPT = '!!window.Store && window.Store.Msg';
const ATTEMPTING_REAUTH_CHECK_SCRIPT = `!!(
  typeof localStorage !== 'undefined'
  && (localStorage['WAToken2'] || localStorage['last-wid-md'])
)`;
const SESSION_INVALID_CHECK_SCRIPT = `!!(
  typeof localStorage !== 'undefined'
  && Object.prototype.hasOwnProperty.call(localStorage, 'old-logout-cred')
)`;
const PHONE_OUT_OF_REACH_CHECK_SCRIPT = `!!(
  typeof document !== 'undefined'
  && document.querySelector('body')
  && document.querySelector('body').innerText.includes('Trying to reach phone')
)`;
const LINK_CODE_AVAILABLE_CHECK_SCRIPT = `!!(typeof window.linkCode === 'function')`;
const LEGACY_IS_INSIDE_CHAT_CHECK_SCRIPT = `!!(
  !!window.WA_AUTHENTICATED
  || (document.getElementsByClassName('app')[0]
    && document.getElementsByClassName('app')[0].attributes
    && !!document.getElementsByClassName('app')[0].attributes.tabindex)
  || (document.getElementsByClassName('two')[0]
    && document.getElementsByClassName('two')[0].attributes
    && !!document.getElementsByClassName('two')[0].attributes.tabindex)
)`;
const AUTHENTICATED_SHELL_CHECK_SCRIPT = `!!(
  (window.isSessionLoaded && window.isSessionLoaded()) ||
  window.WA_AUTHENTICATED ||
  document.querySelector('#pane-side') ||
  document.querySelector('[aria-label="Search or start a new chat"]') ||
  document.querySelector('[data-testid="chat-list-search"]') ||
  (document.getElementsByClassName('app')[0] && document.getElementsByClassName('app')[0].getAttribute('tabindex') != null) ||
  (document.getElementsByClassName('two')[0] && document.getElementsByClassName('two')[0].getAttribute('tabindex') != null)
)`;
const RIPE_SESSION_CHECK_SCRIPT = `(() => {
  try {
    return Boolean(
      (window.isSessionLoaded && window.isSessionLoaded()) ||
      window.WA_AUTHENTICATED
    );
  } catch {
    return false;
  }
})()`;
const DOCUMENT_READY_CHECK_SCRIPT = `!!(
  typeof document === 'undefined'
  || document.readyState === 'interactive'
  || document.readyState === 'complete'
)`;

const RUNTIME_REPLACEMENT_OBSERVER_SCRIPT = `(() => {
  const root = globalThis;
  const existingState = root.__OPENWA_RUNTIME_REPLACEMENT_OBSERVER__;
  if (existingState?.installed) {
    return;
  }

  const descriptor = Object.getOwnPropertyDescriptor(root, 'WAPI');
  if (descriptor && descriptor.configurable === false) {
    root.__OPENWA_RUNTIME_REPLACEMENT_OBSERVER__ = {
      installed: false,
      skipped: true,
      reason: 'non_configurable_property',
    };
    return;
  }

  let currentValue = descriptor?.get ? descriptor.get.call(root) : root.WAPI;
  const originalGet = descriptor?.get ? descriptor.get.bind(root) : null;
  const originalSet = descriptor?.set ? descriptor.set.bind(root) : null;

  const notifyRuntimeReplacement = () => {
    try {
      const notify = root.OpenWA_RuntimeReplacementDetected;
      if (typeof notify === 'function') {
        void notify({ reason: 'runtime_replaced' });
      }
    } catch {
      // Ignore bridge notifications that fail inside the page context.
    }
  };

  Object.defineProperty(root, 'WAPI', {
    configurable: true,
    enumerable: descriptor ? descriptor.enumerable !== false : true,
    get() {
      if (originalGet) {
        const next = originalGet();
        if (next !== undefined) {
          currentValue = next;
        }
      }
      return currentValue;
    },
    set(value) {
      const previous = originalGet ? (originalGet() ?? currentValue) : currentValue;
      if (originalSet) {
        originalSet(value);
      }
      currentValue = value;

      if (previous && value && previous !== value) {
        notifyRuntimeReplacement();
      }
    },
  });

  root.__OPENWA_RUNTIME_REPLACEMENT_OBSERVER__ = {
    installed: true,
    installedAt: Date.now(),
  };
})();`;

export interface RuntimeCapabilityProbe {
  hasRuntime: boolean;
  hasStoreMsg: boolean;
  sessionLoaded: boolean;
}

export type AuthSettlementOutcome = 'authenticated' | 'qr_timeout' | 'auth_timeout' | 'invalid_session' | 'phone_out_of_reach' | 'qr_max';

export interface AuthSettlementResult {
  outcome: AuthSettlementOutcome;
  qrSeen: boolean;
  qrAttempts: number;
  authMethod?: 'qr' | 'link_code' | 'resumed_session';
}

export interface PostAuthRuntimeReconciliationResult extends RuntimeCapabilityProbe {
  ripeSessionLoaded: boolean;
  reinjected: boolean;
  path: 'fresh_auth' | 'resumed_session';
}

export type RuntimeValidationStage = 'post_injection' | 'post_patch' | 'post_overlay';
export type RuntimeValidationFailureReason = 'runtime_missing' | 'store_missing' | 'session_not_loaded' | 'required_method_missing';

export interface RuntimeMethodIntegrityResult {
  bridgeReady: boolean;
  requiredMethods: string[];
  missingMethods: string[];
}

export interface RuntimeValidationResult extends RuntimeCapabilityProbe {
  stage: RuntimeValidationStage;
  usable: boolean;
  repairable: boolean;
  bridgeReady: boolean;
  requiredMethods: string[];
  missingMethods: string[];
  failureReason?: RuntimeValidationFailureReason;
}

export interface TransportOperationalReadinessSnapshot {
  generation: GenerationSnapshot | null;
  phase: string;
  driverActiveGeneration: boolean;
  runtimeOperational: boolean;
  runtimeBridgeReady: boolean;
  reinjectionSettled: boolean;
  missingRuntimeMethods: string[];
}

export type LicenseStatus = 'valid' | 'metadata_only' | 'missing' | 'invalid' | 'expired';
export type LicenseSource = 'local' | 'remote' | 'cached' | 'none';
export type LicenseKeyResolver =
  | string
  | Record<string, string | undefined>
  | ((sessionId: string) => Promise<string | null | undefined> | string | null | undefined);

export interface LicensePreloadOptions {
  sessionId: string;
  licenseKey?: LicenseKeyResolver;
  source?: Exclude<LicenseSource, 'none'>;
  sessionInfo?: SessionDebugInfo;
}

export interface LicenseArtifact {
  key: string;
  maskedKey: string;
  source: Exclude<LicenseSource, 'none'>;
  payload: string;
  keyType: string;
  payloadSource: 'server' | 'local_metadata';
}

export interface LicensePreloadResult {
  outcome: 'ready' | 'missing' | 'failed';
  status: LicenseStatus;
  source: LicenseSource;
  artifact: LicenseArtifact | null;
  blockingFailure: boolean;
  detail?: string;
  error?: Error;
}

export interface LicenseCheckResult {
  status: LicenseStatus;
  source: Exclude<LicenseSource, 'none'>;
  artifact: LicenseArtifact | null;
  blockingFailure: boolean;
  detail?: string;
}

export interface LicenseApplyResult {
  status: LicenseStatus;
  applied: boolean;
  blockingFailure: boolean;
  keyType?: string;
  detail?: string;
}

export type PatchArtifactSource = 'builtin' | 'remote' | 'cached';

export interface PatchArtifact {
  patchId: string;
  description: string;
  required: boolean;
  script: string;
  applicabilityCheckScript?: string;
  source: PatchArtifactSource;
}

export interface PatchPreloadResult {
  outcome: 'ready' | 'none' | 'failed';
  source: 'builtin' | 'remote' | 'cached' | 'none';
  tag: string | null;
  artifacts: PatchArtifact[];
  blockingFailure: boolean;
  error?: Error;
}

export interface PatchApplicationResult {
  patchId: string;
  description?: string;
  required: boolean;
  outcome: 'applied' | 'not_applicable' | 'failed';
  detail?: string;
}

export interface PatchApplyResult {
  outcome: 'applied' | 'skipped' | 'failed';
  applied: string[];
  blockingFailure: boolean;
  results: PatchApplicationResult[];
}

interface RemotePatchFetchResult {
  data: string[];
  tag: string;
  source: 'remote' | 'cached';
}

const BUILTIN_PATCH_ARTIFACTS: readonly PatchArtifact[] = [
  {
    patchId: 'runtime-bootstrap-overlay',
    description: 'Records bootstrap patch attestation after runtime activation.',
    required: true,
    source: 'builtin',
    applicabilityCheckScript: 'Boolean(window.WAPI)',
    script: `(() => {
      if (!window.WAPI) {
        throw new Error('WAPI runtime not available for bootstrap patch attestation');
      }
      window.__OPENWA_PATCH_LIFECYCLE__ = window.__OPENWA_PATCH_LIFECYCLE__ || {};
      window.__OPENWA_PATCH_LIFECYCLE__['runtime-bootstrap-overlay'] = {
        appliedAt: Date.now(),
        mode: 'bootstrap_attestation',
        hasRuntime: !!window.WAPI,
        hasStoreMsg: !!(window.Store && window.Store.Msg),
      };
      return true;
    })();`,
  },
];

/**
 * Builtin init-patch artifact — wraps `injectInitPatch` as a deferred script
 * applied during the patch-apply phase (post-auth finalization).
 * This mirrors legacy `initializer.ts:429`.
 */
const INIT_PATCH_ARTIFACT: PatchArtifact = {
  patchId: 'init-patch-legacy',
  description: 'Legacy init-patch: webpack module interceptor + Store.sendMessage guard.',
  required: true,
  source: 'builtin',
  // No applicability check — always inject; the obfuscated blob handles its own guards.
  script: 'DEFERRED_INIT_PATCH',
};

/** Default patch endpoint (legacy: pkg.patches from package.json) */
const DEFAULT_PATCHES_URL = 'https://cdn.openwa.dev/patches.json';
/** Fallback GitHub raw patches URL */
const GH_PATCHES_FALLBACK_URL = 'https://raw.githubusercontent.com/open-wa/wa-automate-nodejs/master/patches.json';
/** Default license validation endpoint (legacy: pkg.licenseCheckUrl from package.json) */
const DEFAULT_LICENSE_CHECK_URL = 'https://funcs.openwa.dev/license-check';
/** Cache file path relative to cwd */
const PATCH_CACHE_FILENAME = 'patches.cache.json';
/** Cache staleness threshold (24 hours in ms) */
const PATCH_CACHE_MAX_AGE_MS = 86_400_000;

export class Transport {
  private static assetScriptCache = new Map<string, Promise<string>>();
  private driver: IDriver;
  private browser: IBrowser | null = null;
  private page: IPage | null = null;
  private events: HyperEmitter<OpenWAEventMap>;
  private logger: Logger;
  private waWebUrl: string;
  private headless: boolean;
  private qrTimeoutMs: number;
  private authTimeoutMs: number;
  private oorTimeoutMs: number;
  private qrPollingMs: number;
  private navigationTimeoutMs: number;
  private executablePath?: string;
  private browserArgs?: string[];
  private userDataDir?: string;
  private linkCode?: string;
  private qrMax?: number;
  private ignoreNuke: boolean;
  private logConsole: boolean;
  private logConsoleErrors: boolean;
  private blockCrashLogs: boolean;
  private blockAssets: boolean;
  private safeMode: boolean;
  private qrWatcherAbort: AbortController | null = null;
  private qrAttempt = 0;
  private lastQrData: string | null = null;
  private lastRuntimeState: STATE | null = null;
  private patchConfig: PatchFetchConfig;
  private licenseConfig: LicenseServerConfig;
  private pageListeners: DisposableHandle[] = [];
  private readonly injectionController: InjectionController;
  private runtimeRecoveryQueue: Promise<void> = Promise.resolve();
  private latestRuntimeRecoveryRequestId = 0;
  private pendingRuntimeRecoveryCount = 0;

  constructor(options: TransportOptions) {
    this.driver = options.driver;
    this.events = options.events;
    this.logger = options.logger;
    this.waWebUrl = options.waWebUrl ?? 'https://web.whatsapp.com';
    this.headless = options.headless ?? true;
    this.qrTimeoutMs = options.qrTimeoutMs ?? 60000;
    this.authTimeoutMs = options.authTimeoutMs ?? 60000;
    this.oorTimeoutMs = options.oorTimeoutMs ?? 60000;
    this.qrPollingMs = options.qrPollingMs ?? 500;
    this.navigationTimeoutMs = options.navigationTimeoutMs ?? 60_000;
    this.executablePath = options.executablePath;
    this.browserArgs = options.browserArgs;
    this.userDataDir = options.userDataDir;
    this.linkCode = options.linkCode;
    this.qrMax = options.qrMax;
    this.ignoreNuke = options.ignoreNuke ?? false;
    this.logConsole = options.logConsole ?? false;
    this.logConsoleErrors = options.logConsoleErrors ?? false;
    this.blockCrashLogs = options.blockCrashLogs ?? true;
    this.blockAssets = options.blockAssets ?? false;
    this.safeMode = options.safeMode ?? false;
    this.patchConfig = options.patchConfig ?? {};
    this.licenseConfig = options.licenseConfig ?? {};
    this.injectionController = new InjectionController(this.logger);
  }

  async initialize(): Promise<void> {
    this.events.emit('launch.browser.init.before', {
      correlationId: 'transport-init',
      ts: Date.now(),
      step: 'browser_init',
      details: { headless: this.headless }
    });

    await this.driver.init();
    this.browser = await this.driver.launch({
      headless: this.headless,
      executablePath: this.executablePath,
      args: [...chromiumConfig.chromiumArgs, ...(this.browserArgs || [])],
      userDataDir: this.userDataDir,
      defaultViewport: null,
    });
    this.page = await this.browser.newPage();

    // this is required to fix reauthentication
    await this.page.evaluateOnNewDocument(
      session => {
        localStorage.clear();
        Object.keys(session).forEach(key => localStorage.setItem(key, session[key]));
      }, {
      "md-opted-in": "true",
      "MdUpgradeWamFlag": "true",
      "remember-me": "true"
    })

    await this.configurePageRuntime(this.page);

    await this.page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
    );

    this.events.emit('launch.browser.init.after', {
      correlationId: 'transport-init',
      ts: Date.now(),
      step: 'browser_init',
      details: {}
    });

    this.logger.info('transport_initialized', { driverName: this.driver.name });
  }

  async navigate(): Promise<void> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    this.events.emit('launch.navigation.gotoWaWeb.before', {
      correlationId: 'transport-nav',
      ts: Date.now(),
      step: 'navigation',
      details: { url: this.waWebUrl }
    });
    await this.page.goto(this.waWebUrl, {
      waitUntil: 'domcontentloaded',
      timeoutMs: this.navigationTimeoutMs,
    });

    this.events.emit('launch.navigation.gotoWaWeb.after', {
      correlationId: 'transport-nav',
      ts: Date.now(),
      step: 'navigation',
      details: { finalUrl: this.page.url() }
    });

    this.logger.info('transport_navigated', { url: this.waWebUrl });
    await this.configureLaunchBootstrap(this.page);
  }

  async injectWapi(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    this.events.emit('launch.wapi.inject.before', {
      correlationId: 'transport-inject',
      ts: Date.now(),
      step: 'wapi_inject',
      details: { injectPreApiScripts: true }
    });

    let success = false;

    try {
      await this.runPreApiHelperPhase();
      success = await this.performRuntimeInjection();

      return success;
    } finally {
      this.events.emit('launch.wapi.inject.after', {
        correlationId: 'transport-inject',
        ts: Date.now(),
        step: 'wapi_inject',
        details: { success }
      });
    }
  }

  async configureRuntimeEventBridge(): Promise<void> {
    const messageReceivedSurface = getRuntimeListenerSurfaceEntry('message.received');
    const messageAnySurface = getRuntimeListenerSurfaceEntry('message.any');
    const ackChangedSurface = getRuntimeListenerSurfaceEntry('ack.changed');
    const stateChangedSurface = getRuntimeListenerSurfaceEntry('session.state.changed');
    const addedToGroupSurface = getRuntimeListenerSurfaceEntry('group.addedToGroup');

    await this.injectionController.registerRuntimeWapiBridge(
      messageReceivedSurface.event,
      messageReceivedSurface.bindingName,
      (message: unknown) => {
        this.events.emit('message.received', {
          ctx: { correlationId: 'runtime-message-received', ts: Date.now() },
          message,
        });
      },
      { wapiMethod: messageReceivedSurface.wapiMethod, required: messageReceivedSurface.required },
    );

    await this.injectionController.registerRuntimeWapiBridge(
      messageAnySurface.event,
      messageAnySurface.bindingName,
      (message: unknown) => {
        this.events.emit('message.any', {
          ctx: { correlationId: 'runtime-message-any', ts: Date.now() },
          message,
        });
      },
      { wapiMethod: messageAnySurface.wapiMethod, required: messageAnySurface.required },
    );

    await this.injectionController.registerRuntimeWapiBridge(
      ackChangedSurface.event,
      ackChangedSurface.bindingName,
      (ack: unknown) => {
        this.events.emit('ack.changed', {
          ctx: { correlationId: 'runtime-ack-changed', ts: Date.now() },
          ack,
        });
      },
      { wapiMethod: ackChangedSurface.wapiMethod, required: ackChangedSurface.required },
    );

    await this.injectionController.registerRuntimeWapiBridge(
      stateChangedSurface.event,
      stateChangedSurface.bindingName,
      (state: unknown) => {
        const next = (typeof state === 'string' ? state : String(state ?? '')) as STATE;
        const prev = this.lastRuntimeState ?? next;
        this.lastRuntimeState = next || this.lastRuntimeState;

        this.events.emit('session.state.changed', {
          correlationId: 'runtime-session-state',
          ts: Date.now(),
          step: 'session_state_changed',
          details: { prev, next },
        });
      },
      { wapiMethod: stateChangedSurface.wapiMethod, required: stateChangedSurface.required },
    );

    await this.injectionController.registerRuntimeWapiBridge(
      addedToGroupSurface.event,
      addedToGroupSurface.bindingName,
      (chat: Record<string, unknown> | null | undefined) => {
        const groupId = String(chat?.id ?? chat?.chatId ?? '');
        if (!groupId) {
          return;
        }

        this.events.emit('group.addedToGroup', {
          ctx: { correlationId: 'runtime-group-added', ts: Date.now() },
          groupId,
          by: typeof chat?.['groupMetadata'] === 'object' ? undefined : undefined,
        });
      },
      { wapiMethod: addedToGroupSurface.wapiMethod, required: addedToGroupSurface.required },
    );

    this.logger.info('runtime_event_bridge_bindings_registered', {
      bindings: [
        messageReceivedSurface.bindingName,
        messageAnySurface.bindingName,
        ackChangedSurface.bindingName,
        stateChangedSurface.bindingName,
        addedToGroupSurface.bindingName,
      ],
      requiredMethods: this.injectionController.getRequiredRuntimeMethods(),
    });

    const bridgeReady = await this.injectionController.ensureRuntimeBridge();
    const capability = await this.probeRuntimeCapability();
    this.logger.info('runtime_event_bridge_ready', {
      bridgeReady,
      hasRuntime: capability.hasRuntime,
      hasStoreMsg: capability.hasStoreMsg,
      sessionLoaded: capability.sessionLoaded,
    });
  }

  async probeRuntimeCapability(): Promise<RuntimeCapabilityProbe> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    const probes = [
      { key: 'hasRuntime', script: WAPI_RUNTIME_CHECK_SCRIPT },
      { key: 'hasStoreMsg', script: STORE_MSG_CHECK_SCRIPT },
      { key: 'sessionLoaded', script: AUTHENTICATED_SHELL_CHECK_SCRIPT },
    ] as const;

    const capability: RuntimeCapabilityProbe = {
      hasRuntime: false,
      hasStoreMsg: false,
      sessionLoaded: false,
    };

    for (const probe of probes) {
      try {
        const value = await this.evaluateBooleanScript(probe.script);
        capability[probe.key] = value;
      } catch (error) {
        this.logger.error('runtime_capability_probe_failed', {
          probe: probe.key,
          scriptPreview: probe.script.replace(/\s+/g, ' ').trim().slice(0, 180),
          error: error instanceof Error ? error : new Error(String(error)),
        });
        this.logger.error('probe_runtime_capability_failed', {
          probe: probe.key,
          error: error instanceof Error ? error : new Error(String(error)),
        });
        break;
      }
    }

    return capability;
  }

  async validateRuntimeUsability(stage: RuntimeValidationStage): Promise<RuntimeValidationResult> {
    try {

      const capability = await this.probeRuntimeCapability();
      const integrity = capability.hasRuntime
        ? await this.probeBrokenMethodIntegrity()
        : {
          bridgeReady: false,
          requiredMethods: this.injectionController.getRequiredRuntimeMethods(),
          missingMethods: [],
        } satisfies RuntimeMethodIntegrityResult;

      const failureReason = !capability.hasRuntime
        ? 'runtime_missing'
        : (stage === 'post_patch' || stage === 'post_overlay') && !capability.hasStoreMsg
          ? 'store_missing'
          : (stage === 'post_patch' || stage === 'post_overlay') && !capability.sessionLoaded
            ? 'session_not_loaded'
            : integrity.missingMethods.length > 0 || !integrity.bridgeReady
              ? 'required_method_missing'
              : undefined;

      const usable = failureReason === undefined;

      return {
        ...capability,
        ...integrity,
        stage,
        usable,
        repairable: !usable,
        failureReason,
      };
    } catch (error) {
      console.log("ERRORED OUT IN VALIDATE RUNTIME USABILITY", error)
      throw error;
    }
  }

  async repairRuntimeIntegrity(reason: RuntimeValidationFailureReason): Promise<boolean> {
    this.logger.info('broken_method_integrity_gate_repair', { reason });
    const recovery = await this.recoverRuntimeForCurrentDocument({
      trigger: 'validation_failure',
      forceReinject: true,
    });

    return recovery.reinjected || recovery.capability.hasRuntime;
  }

  async preloadPatchArtifacts(options?: { sessionInfo?: SessionDebugInfo }): Promise<PatchPreloadResult> {
    const correlationId = 'transport-patch-preload';
    const startTime = Date.now();

    this.events.emit('launch.patch.init.before', {
      correlationId,
      ts: startTime,
      step: 'patch_preload',
      details: { phase: 'preload', source: 'builtin' },
    });

    try {
      // Start with builtin attestation artifacts
      const artifacts: PatchArtifact[] = BUILTIN_PATCH_ARTIFACTS.map((artifact) => ({ ...artifact }));

      // Attempt remote patch fetch
      let remoteFetchResult: RemotePatchFetchResult | null = null;

      try {
        remoteFetchResult = await this.fetchRemotePatchesWithCache(options?.sessionInfo);
      } catch (fetchError) {
        const fetchMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
        this.logger.warn('remote_patch_fetch_failed', { error: fetchMsg });
        // Remote fetch failure is non-blocking — we fall through to builtin-only
      }

      if (remoteFetchResult) {
        // Append remote patches after builtin attestation
        for (let i = 0; i < remoteFetchResult.data.length; i++) {
          artifacts.push({
            patchId: `remote-patch-${i}`,
            description: `Remote live patch #${i} (tag: ${remoteFetchResult.tag})`,
            script: remoteFetchResult.data[i],
            required: false,
            source: remoteFetchResult.source,
          });
        }
      }

      const effectiveSource = remoteFetchResult?.source ?? (artifacts.length > 0 ? 'builtin' : 'none');
      const tag = remoteFetchResult?.tag
        ?? (artifacts.length > 0
          ? createHash('sha1').update(JSON.stringify(artifacts)).digest('hex').slice(0, 8)
          : null);

      const outcome: PatchPreloadResult = {
        outcome: artifacts.length > 0 ? 'ready' : 'none',
        source: effectiveSource,
        tag,
        artifacts,
        blockingFailure: false,
      };

      this.events.emit('launch.patch.init.after', {
        correlationId,
        ts: Date.now(),
        step: 'patch_preload',
        durationMs: Date.now() - startTime,
        details: {
          phase: 'preload',
          applied: [],
          available: artifacts.map((artifact) => artifact.patchId),
          outcome: outcome.outcome,
          source: outcome.source,
          tag: outcome.tag,
          blockingFailure: outcome.blockingFailure,
        },
      });

      return outcome;
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      const outcome: PatchPreloadResult = {
        outcome: 'failed',
        source: 'builtin',
        tag: null,
        artifacts: [],
        blockingFailure: true,
        error: normalizedError,
      };

      this.events.emit('launch.patch.init.after', {
        correlationId,
        ts: Date.now(),
        step: 'patch_preload',
        durationMs: Date.now() - startTime,
        error: {
          name: normalizedError.name,
          message: normalizedError.message,
          stack: normalizedError.stack,
        },
        details: {
          phase: 'preload',
          applied: [],
          available: [],
          outcome: outcome.outcome,
          source: outcome.source,
          tag: outcome.tag,
          blockingFailure: outcome.blockingFailure,
        },
      });

      return outcome;
    }
  }

  async applyPatchArtifacts(preloaded: PatchPreloadResult): Promise<PatchApplyResult> {
    if (preloaded.outcome === 'failed') {
      return this.buildFailedPatchApplyResult(preloaded);
    }

    return this.applyPatchArtifactSequence(preloaded.artifacts, {
      correlationId: 'transport-patch-apply',
      preloadOutcome: preloaded.outcome,
    });
  }

  async applyDeferredInitPatchArtifact(): Promise<PatchApplyResult> {
    return this.applyPatchArtifactSequence([{ ...INIT_PATCH_ARTIFACT }], {
      correlationId: 'transport-init-patch-apply',
      preloadOutcome: 'ready',
    });
  }

  private buildFailedPatchApplyResult(preloaded: PatchPreloadResult): PatchApplyResult {
    return {
      outcome: 'failed',
      applied: [],
      blockingFailure: preloaded.blockingFailure,
      results: preloaded.error
        ? [{
          patchId: 'patch-preload',
          description: 'Patch preload failed before application could begin.',
          required: true,
          outcome: 'failed',
          detail: preloaded.error.message,
        }]
        : [],
    };
  }

  private async applyPatchArtifactSequence(
    artifacts: PatchArtifact[],
    options: {
      correlationId: string;
      preloadOutcome: PatchPreloadResult['outcome'];
    },
  ): Promise<PatchApplyResult> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    const correlationId = options.correlationId;
    const startTime = Date.now();
    const patchIds = artifacts.map((artifact) => artifact.patchId);

    this.events.emit('patch.init.before', {
      correlationId,
      ts: startTime,
      step: 'patch_apply',
      details: {
        phase: 'apply',
        patchIds,
        preloadOutcome: options.preloadOutcome,
      },
    });

    const applied: string[] = [];
    const results: PatchApplicationResult[] = [];
    let blockingFailure = false;

    for (const artifact of artifacts) {
      const patchStartTime = Date.now();
      this.events.emit('patch.apply.before', {
        correlationId,
        ts: patchStartTime,
        step: 'patch_apply_item',
        details: {
          patchId: artifact.patchId,
          description: artifact.description,
          required: artifact.required,
          source: artifact.source,
        },
      });

      let result: PatchApplicationResult;

      try {
        const applicable = artifact.applicabilityCheckScript
          ? await this.evaluateBooleanScript(artifact.applicabilityCheckScript)
          : true;

        if (!applicable) {
          result = {
            patchId: artifact.patchId,
            description: artifact.description,
            required: artifact.required,
            outcome: 'not_applicable',
            detail: 'Patch applicability check returned false.',
          };
          if (artifact.required) {
            blockingFailure = true;
          }
        } else {
          let appliedSuccessfully: boolean;
          // Handle deferred init-patch: call the actual injection function directly
          if (artifact.script === 'DEFERRED_INIT_PATCH') {
            this.logger.info('applying_deferred_init_patch', { patchId: artifact.patchId });
            await injectInitPatch(this.page);
            appliedSuccessfully = true; // deferred patches succeed if no exception thrown
          } else {
            const applyResult = await this.page.evaluateScript<unknown>(artifact.script);
            appliedSuccessfully = applyResult !== false;
          }

          if (!appliedSuccessfully) {
            result = {
              patchId: artifact.patchId,
              description: artifact.description,
              required: artifact.required,
              outcome: 'failed',
              detail: 'Patch script returned a failure signal.',
            };
            if (artifact.required) {
              blockingFailure = true;
            }
          } else {
            applied.push(artifact.patchId);
            result = {
              patchId: artifact.patchId,
              description: artifact.description,
              required: artifact.required,
              outcome: 'applied',
            };
          }
        }
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        result = {
          patchId: artifact.patchId,
          description: artifact.description,
          required: artifact.required,
          outcome: 'failed',
          detail: normalizedError.message,
        };
        if (artifact.required) {
          blockingFailure = true;
        }
      }

      results.push(result);

      this.events.emit('patch.apply.after', {
        correlationId,
        ts: Date.now(),
        step: 'patch_apply_item',
        durationMs: Date.now() - patchStartTime,
        details: {
          patchId: artifact.patchId,
          applied: result.outcome === 'applied',
          outcome: result.outcome,
          required: artifact.required,
          detail: result.detail,
        },
      });
    }

    const outcome: PatchApplyResult = {
      outcome: blockingFailure
        ? 'failed'
        : applied.length > 0
          ? 'applied'
          : 'skipped',
      applied,
      blockingFailure,
      results,
    };

    this.events.emit('patch.init.after', {
      correlationId,
      ts: Date.now(),
      step: 'patch_apply',
      durationMs: Date.now() - startTime,
      details: {
        phase: 'apply',
        applied: outcome.applied,
        outcome: outcome.outcome,
        blockingFailure: outcome.blockingFailure,
        results: outcome.results,
      },
    });

    return outcome;
  }

  async preloadLicenseArtifact(options: LicensePreloadOptions): Promise<LicensePreloadResult> {
    const correlationId = 'transport-license-preload';
    const startTime = Date.now();
    const source = options.source ?? 'local';

    this.events.emit('launch.license.preload.before', {
      correlationId,
      ts: startTime,
      step: 'license_preload',
      details: { source },
    });

    try {
      const resolvedKey = await this.resolveLicenseKey(options.licenseKey, options.sessionId);

      if (!resolvedKey) {
        const outcome: LicensePreloadResult = {
          outcome: 'missing',
          status: 'missing',
          source: 'none',
          artifact: null,
          blockingFailure: false,
          detail: 'No license key resolved for this runtime session.',
        };

        this.events.emit('launch.license.preload.after', {
          correlationId,
          ts: Date.now(),
          step: 'license_preload',
          durationMs: Date.now() - startTime,
          details: {
            success: false,
            status: outcome.status,
            source: outcome.source,
            detail: outcome.detail,
            blockingFailure: outcome.blockingFailure,
          },
        });

        return outcome;
      }

      const keyType = this.deriveLicenseKeyType(resolvedKey);

      // Attempt server validation if not in offline mode
      let payload: string;
      let payloadSource: 'server' | 'local_metadata';

      if (!this.licenseConfig.offlineLicenseMode && options.sessionInfo?.hostNumber) {
        try {
          const licenseCheckUrl = this.licenseConfig.licenseCheckUrl ?? DEFAULT_LICENSE_CHECK_URL;
          const serverPayload = await validateLicense(licenseCheckUrl, {
            key: resolvedKey,
            number: options.sessionInfo.hostNumber,
            WA_VERSION: options.sessionInfo.WA_VERSION,
            WA_AUTOMATE_VERSION: options.sessionInfo.WA_AUTOMATE_VERSION,
            BROWSER_VERSION: options.sessionInfo.BROWSER_VERSION,
            PAGE_UA: options.sessionInfo.PAGE_UA,
            OS: options.sessionInfo.OS,
            NUM_HASH: options.sessionInfo.NUM_HASH,
          });

          if (serverPayload === false) {
            // Server rejected the key
            const outcome: LicensePreloadResult = {
              outcome: 'failed',
              status: 'invalid',
              source,
              artifact: null,
              blockingFailure: true,
              detail: 'License key was rejected by the validation server.',
            };

            this.events.emit('launch.license.preload.after', {
              correlationId,
              ts: Date.now(),
              step: 'license_preload',
              durationMs: Date.now() - startTime,
              details: {
                success: false,
                status: outcome.status,
                source: outcome.source,
                detail: outcome.detail,
                blockingFailure: outcome.blockingFailure,
              },
            });

            return outcome;
          }

          payload = serverPayload;
          payloadSource = 'server';
          this.logger.info('license_server_validation_success', { maskedKey: this.maskLicenseKey(resolvedKey) });
        } catch (serverError) {
          const serverMsg = serverError instanceof Error ? serverError.message : String(serverError);
          this.logger.warn('license_server_validation_failed', { error: serverMsg });
          // Fall back to local metadata injection
          payload = this.buildLicensePayload(resolvedKey, keyType);
          payloadSource = 'local_metadata';
        }
      } else {
        // Offline mode or no host number yet — use local metadata
        payload = this.buildLicensePayload(resolvedKey, keyType);
        payloadSource = 'local_metadata';
      }

      const artifact: LicenseArtifact = {
        key: resolvedKey,
        maskedKey: this.maskLicenseKey(resolvedKey),
        source,
        payload,
        keyType,
        payloadSource,
      };

      const outcome: LicensePreloadResult = {
        outcome: 'ready',
        status: payloadSource === 'server' ? 'valid' : 'metadata_only',
        source,
        artifact,
        blockingFailure: false,
        detail: payloadSource === 'server'
          ? 'License capability was confirmed by the validation server.'
          : 'License metadata fallback was prepared without server confirmation.',
      };

      this.events.emit('launch.license.preload.after', {
        correlationId,
        ts: Date.now(),
        step: 'license_preload',
        durationMs: Date.now() - startTime,
        details: {
          success: true,
          status: outcome.status,
          source: outcome.source,
          payloadSource: artifact.payloadSource,
          detail: outcome.detail,
          blockingFailure: outcome.blockingFailure,
        },
      });

      return outcome;
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      const outcome: LicensePreloadResult = {
        outcome: 'failed',
        status: 'invalid',
        source,
        artifact: null,
        blockingFailure: true,
        detail: normalizedError.message,
        error: normalizedError,
      };

      this.events.emit('launch.license.preload.after', {
        correlationId,
        ts: Date.now(),
        step: 'license_preload',
        durationMs: Date.now() - startTime,
        error: {
          name: normalizedError.name,
          message: normalizedError.message,
          stack: normalizedError.stack,
        },
        details: {
          success: false,
          status: outcome.status,
          source: outcome.source,
          detail: outcome.detail,
          blockingFailure: outcome.blockingFailure,
        },
      });

      return outcome;
    }
  }

  async checkLicenseArtifact(preloaded: LicensePreloadResult): Promise<LicenseCheckResult> {
    const correlationId = 'transport-license-check';
    const startTime = Date.now();
    const source = preloaded.source === 'none' ? 'local' : preloaded.source;

    this.events.emit('launch.license.check.before', {
      correlationId,
      ts: startTime,
      step: 'license_check',
      details: { source },
    });

    this.events.emit('license.check.before', {
      correlationId,
      ts: startTime,
      step: 'license_check',
      details: { source },
    });

    let result: LicenseCheckResult;

    if (preloaded.outcome === 'failed') {
      result = {
        status: 'invalid',
        source,
        artifact: null,
        blockingFailure: true,
        detail: preloaded.detail ?? preloaded.error?.message ?? 'License preload failed before validation.',
      };
    } else if (!preloaded.artifact) {
      result = {
        status: 'missing',
        source,
        artifact: null,
        blockingFailure: false,
        detail: preloaded.detail ?? 'No license material was available for this session.',
      };
    } else if (this.isExpiredLicenseKey(preloaded.artifact.key)) {
      result = {
        status: 'expired',
        source,
        artifact: null,
        blockingFailure: true,
        detail: 'Resolved license key is marked as expired.',
      };
    } else if (this.isInvalidLicenseKey(preloaded.artifact.key)) {
      result = {
        status: 'invalid',
        source,
        artifact: null,
        blockingFailure: true,
        detail: 'Resolved license key is marked as invalid.',
      };
    } else {
      result = {
        status: preloaded.artifact.payloadSource === 'server' ? 'valid' : 'metadata_only',
        source,
        artifact: preloaded.artifact,
        blockingFailure: false,
        detail: preloaded.artifact.payloadSource === 'server'
          ? 'License capability remained server-confirmed at check time.'
          : 'License metadata fallback is available, but capability is not server-confirmed.',
      };
    }

    const finishedAt = Date.now();
    const details = {
      status: result.status,
      detail: result.detail,
      source: result.source,
      payloadSource: result.artifact?.payloadSource,
      blockingFailure: result.blockingFailure,
    };

    this.events.emit('launch.license.check.after', {
      correlationId,
      ts: finishedAt,
      step: 'license_check',
      durationMs: finishedAt - startTime,
      details,
    });

    this.events.emit('license.check.after', {
      correlationId,
      ts: finishedAt,
      step: 'license_check',
      durationMs: finishedAt - startTime,
      details,
    });

    return result;
  }

  async applyLicenseArtifact(checked: LicenseCheckResult): Promise<LicenseApplyResult> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    if ((checked.status !== 'valid' && checked.status !== 'metadata_only') || !checked.artifact) {
      return {
        status: checked.status,
        applied: false,
        blockingFailure: checked.blockingFailure,
        detail: checked.detail,
      };
    }

    const correlationId = 'transport-license-apply';
    const startTime = Date.now();

    this.events.emit('license.inject.before', {
      correlationId,
      ts: startTime,
      step: 'license_apply',
      details: {
        source: checked.source,
        keyType: checked.artifact.keyType,
      },
    });

    let result: LicenseApplyResult;

    try {
      const applied = await this.page.evaluateScript<boolean>(checked.artifact.payload);
      const launchError = await this.page.evaluateScript<string | null>('window.launchError || null');
      const detectedKeyType = await this.page.evaluateScript<string | false>('window.KEYTYPE || false');

      if (!applied || launchError) {
        result = {
          status: 'invalid',
          applied: false,
          blockingFailure: true,
          detail: launchError ?? 'License payload did not confirm successful application.',
        };
      } else {
        result = {
          status: checked.status,
          applied: true,
          blockingFailure: false,
          keyType: detectedKeyType || checked.artifact.keyType,
          detail: checked.status === 'valid'
            ? 'License capability was unlocked using a server-confirmed payload.'
            : 'Metadata-only license fallback injected session metadata without server-confirmed unlock.',
        };
      }
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      result = {
        status: 'invalid',
        applied: false,
        blockingFailure: true,
        detail: normalizedError.message,
      };
    }

    this.events.emit('license.inject.after', {
      correlationId,
      ts: Date.now(),
      step: 'license_apply',
      durationMs: Date.now() - startTime,
      details: {
        success: result.applied,
        status: result.status,
        keyType: result.keyType,
        payloadSource: checked.artifact.payloadSource,
        detail: result.detail,
      },
    });

    return result;
  }

  async waitForQr(): Promise<string | null> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    this.events.emit('launch.auth.qr.requested', {
      correlationId: 'qr-wait',
      ts: Date.now(),
      step: 'qr_wait',
      details: { smartQr: false }
    });

    this.qrWatcherAbort = new AbortController();

    try {
      await this.waitForFunctionProbe(`Boolean(${QR_CHECK_SCRIPT})`, {
        timeoutMs: this.qrTimeoutMs,
        polling: 'mutation',
      });
    } catch {
      this.events.emit('launch.auth.timeout', {
        correlationId: 'qr-wait',
        ts: Date.now(),
        step: 'qr_timeout',
        details: { timeoutMs: this.qrTimeoutMs }
      });
      return null;
    }

    if (this.qrWatcherAbort?.signal.aborted) {
      return null;
    }

    try {
      const qrData = await this.page.evaluateScript<string | null>(QR_CHECK_SCRIPT);
      if (qrData && typeof qrData === 'string' && qrData !== this.lastQrData) {
        this.lastQrData = qrData;
        this.qrAttempt++;
        this.events.emit('launch.auth.qr.generated', {
          correlationId: 'qr-wait',
          ts: Date.now(),
          step: 'qr_generated',
          details: {
            qr: qrData,
            attemptInThisCycle: this.qrAttempt
          }
        });
        this.logger.info('qr_code_generated', { attempt: this.qrAttempt });
      }
      return qrData;
    } catch (error) {
      this.logger.debug('qr_check_error', { error });
      return null;
    }
  }

  async waitForSessionLoaded(timeoutMs: number = this.authTimeoutMs): Promise<boolean> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    try {
      await this.page.waitForFunction(AUTHENTICATED_SHELL_CHECK_SCRIPT, {
        timeoutMs,
        polling: 'mutation',
      });
      this.events.emit('launch.auth.qr.scanned', {
        correlationId: 'auth-wait',
        ts: Date.now(),
        step: 'qr_scanned',
      });
      return true;
    } catch {
      return false;
    }
  }

  async waitForRipeSession(timeoutMs: number = this.authTimeoutMs): Promise<boolean> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    try {
      await this.page.waitForFunction(RIPE_SESSION_CHECK_SCRIPT, {
        timeoutMs,
        polling: 1000,
      });
      return true;
    } catch {
      return false;
    }
  }

  async detectAttemptingReauth(): Promise<boolean> {
    return this.evaluateBooleanScript(ATTEMPTING_REAUTH_CHECK_SCRIPT);
  }

  async reconcilePostAuthRuntime(options: {
    freshAuth: boolean;
    timeoutMs?: number;
  }): Promise<PostAuthRuntimeReconciliationResult> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    const timeoutMs = options.timeoutMs ?? this.authTimeoutMs;
    const path = options.freshAuth ? 'fresh_auth' : 'resumed_session';
    let reinjected = false;

    await this.injectionController.waitForIdle();

    const capabilityBeforeGate = await this.probeRuntimeCapability();
    if (options.freshAuth || !capabilityBeforeGate.hasRuntime) {
      const recoveryResult = await this.recoverRuntimeForCurrentDocument({
        trigger: 'post_authentication',
        forceReinject: options.freshAuth,
      });
      reinjected = recoveryResult.reinjected;
    }

    const shouldWaitForRipeSession = !options.freshAuth;
    const ripeSessionLoaded = shouldWaitForRipeSession
      ? await this.waitForRipeSession(timeoutMs)
      : true;
    if (shouldWaitForRipeSession && !ripeSessionLoaded) {
      this.events.emit('session.reinject.qr.waiting', {
        correlationId: 'post-auth-ripe-session',
        ts: Date.now(),
        step: 'ripe_session_wait',
        details: {
          reason: 'ripe_session_timeout',
        },
      });

      const timeoutCapability = await this.probeRuntimeCapability();
      return {
        ...timeoutCapability,
        ripeSessionLoaded: false,
        reinjected,
        path,
      };
    }

    await this.injectionController.waitForIdle();
    const finalRecovery = await this.recoverRuntimeForCurrentDocument({
      trigger: 'post_authentication',
      forceReinject: false,
    });

    return {
      ...finalRecovery.capability,
      ripeSessionLoaded: finalRecovery.capability.sessionLoaded,
      reinjected: reinjected || finalRecovery.reinjected,
      path,
    };
  }

  private async needsToScan(): Promise<false> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    await Promise.race([
      this.page.waitForSelector(QR_SELECTOR_PRIMARY, { timeoutMs: 0 }),
      this.page.waitForSelector(QR_SELECTOR_FALLBACK, { timeoutMs: 0 }),
    ]);
    return false;
  }

  private async isInsideChat(): Promise<true> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    await this.page.waitForFunction(LEGACY_IS_INSIDE_CHAT_CHECK_SCRIPT, {
      timeoutMs: 0,
    });
    return true;
  }

  private async sessionDataInvalid(): Promise<'NUKE'> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    await this.page.waitForFunction(SESSION_INVALID_CHECK_SCRIPT, {
      timeoutMs: 0,
      polling: 'mutation',
    });
    return 'NUKE';
  }

  async isAuthenticated(): Promise<unknown> {
    const signals: Array<Promise<unknown>> = [
      this.needsToScan(),
      this.isInsideChat(),
    ];

    if (!this.ignoreNuke) {
      signals.push(this.sessionDataInvalid());
    }

    return Promise.race(signals);
  }

  async waitForAuthentication(_options?: { attemptingReauth?: boolean }): Promise<AuthSettlementResult> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    this.events.emit('launch.auth.check.before', {
      correlationId: 'auth-settle',
      ts: Date.now(),
      step: 'auth_check',
      details: { timeoutMs: this.authTimeoutMs },
    });

    this.events.emit('launch.auth.qr.requested', {
      correlationId: 'auth-settle',
      ts: Date.now(),
      step: 'qr_wait',
      details: { smartQr: false },
    });

    const authRace: Array<Promise<unknown>> = [this.isAuthenticated().catch(() => undefined)];
    if (this.authTimeoutMs !== 0) {
      authRace.push(new Promise((resolve) => {
        setTimeout(() => resolve('timeout'), this.authTimeoutMs);
      }));
    }

    const authenticated = await Promise.race(authRace);

    if (authenticated === true) {
      this.events.emit('launch.auth.check.after', {
        correlationId: 'auth-settle',
        ts: Date.now(),
        step: 'auth_check',
        details: { isAuthenticated: true, method: 'shell_probe' },
      });

      return {
        outcome: 'authenticated',
        qrSeen: false,
        qrAttempts: this.qrAttempt,
        authMethod: 'resumed_session',
      };
    }

    if (authenticated === 'NUKE') {
      this.events.emit('launch.auth.nuke.detected', {
        correlationId: 'auth-settle',
        ts: Date.now(),
        step: 'nuke_detected',
        details: { reason: 'old_logout_cred_detected' },
      });

      return {
        outcome: 'invalid_session',
        qrSeen: false,
        qrAttempts: this.qrAttempt,
        authMethod: 'resumed_session',
      };
    }

    if (authenticated === 'timeout') {
      const phoneOutOfReach = await this.waitForPhoneOutOfReach();

      this.events.emit('launch.auth.timeout', {
        correlationId: 'auth-settle',
        ts: Date.now(),
        step: 'auth_timeout',
        details: {
          timeoutMs: this.authTimeoutMs,
          phoneOutOfReach,
        },
      });

      if (phoneOutOfReach) {
        this.events.emit('launch.auth.phoneOutOfReach', {
          correlationId: 'auth-settle',
          ts: Date.now(),
          step: 'phone_out_of_reach',
          details: { reason: 'trying_to_reach_phone' },
        });

        return {
          outcome: 'phone_out_of_reach',
          qrSeen: false,
          qrAttempts: this.qrAttempt,
          authMethod: 'resumed_session',
        };
      }

      return {
        outcome: 'auth_timeout',
        qrSeen: false,
        qrAttempts: this.qrAttempt,
        authMethod: 'resumed_session',
      };
    }

    if (this.linkCode) {
      const linkCodeSupported = await this.evaluateBooleanScript(LINK_CODE_AVAILABLE_CHECK_SCRIPT).catch(() => false);
      if (linkCodeSupported) {
        this.events.emit('launch.auth.linkCode.requested', {
          correlationId: 'auth-settle',
          ts: Date.now(),
          step: 'link_code_requested',
        });

        const generatedLinkCode = await this.page.evaluateScript<string | null>(`(() => {
          try {
            return typeof window.linkCode === 'function' ? window.linkCode(${JSON.stringify(this.linkCode)}) : null;
          } catch {
            return null;
          }
        })()`);

        if (generatedLinkCode && typeof generatedLinkCode === 'string') {
          this.qrAttempt += 1;
          this.events.emit('launch.auth.linkCode.generated', {
            correlationId: 'auth-settle',
            ts: Date.now(),
            step: 'link_code_generated',
            details: { linkCode: generatedLinkCode },
          });
          this.logger.info('link_code_generated', { attempt: this.qrAttempt });

          if (this.qrMax && this.qrAttempt > this.qrMax) {
            return {
              outcome: 'qr_max',
              qrSeen: true,
              qrAttempts: this.qrAttempt,
              authMethod: 'link_code',
            };
          }

          const linkCodeTimeoutMs = this.qrTimeoutMs === 0 ? 0 : this.qrTimeoutMs * 2;
          const sessionLoaded = await this.waitForSessionLoaded(linkCodeTimeoutMs || this.authTimeoutMs);
          return sessionLoaded
            ? {
              outcome: 'authenticated',
              qrSeen: true,
              qrAttempts: this.qrAttempt,
              authMethod: 'link_code',
            }
            : {
              outcome: 'qr_timeout',
              qrSeen: true,
              qrAttempts: this.qrAttempt,
              authMethod: 'link_code',
            };
        }
      } else {
        this.logger.warn('link_code_not_available', {
          reason: 'window.linkCode_not_exposed',
          fallback: 'qr_flow',
        });
      }
    }

    const qrData = await this.waitForQr();
    if (!qrData) {
      return {
        outcome: 'qr_timeout',
        qrSeen: false,
        qrAttempts: this.qrAttempt,
        authMethod: 'qr',
      };
    }

    if (this.qrMax && this.qrAttempt > this.qrMax) {
      return {
        outcome: 'qr_max',
        qrSeen: true,
        qrAttempts: this.qrAttempt,
        authMethod: 'qr',
      };
    }

    const qrScanTimeoutMs = this.qrTimeoutMs === 0 ? 0 : this.qrTimeoutMs * 2;
    const sessionLoaded = await this.waitForSessionLoaded(qrScanTimeoutMs || this.authTimeoutMs);
    return sessionLoaded
      ? {
        outcome: 'authenticated',
        qrSeen: true,
        qrAttempts: this.qrAttempt,
        authMethod: 'qr',
      }
      : {
        outcome: 'qr_timeout',
        qrSeen: true,
        qrAttempts: this.qrAttempt,
        authMethod: 'qr',
      };
  }

  private async waitForPhoneOutOfReach(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    try {
      await this.page.waitForFunction(PHONE_OUT_OF_REACH_CHECK_SCRIPT, {
        timeoutMs: this.oorTimeoutMs,
        polling: 'mutation',
      });
      return true;
    } catch {
      return false;
    }
  }

  stopQrWatcher(): void {
    this.qrWatcherAbort?.abort();
    this.qrWatcherAbort = null;
  }

  async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }
    return this.page.evaluate(fn, arg);
  }

  getPage(): IPage | null {
    return this.page;
  }

  getOperationalReadinessSnapshot(): TransportOperationalReadinessSnapshot {
    const health = this.injectionController.getHealthSnapshot();
    const driverActiveGeneration = Boolean(
      this.page
      && !this.page.isClosed()
      && health.phase !== 'disposed'
      && health.generation.documentId
      && health.generation.runtimeId
    );
    const missingRuntimeMethods = [...health.missingRuntimeMethods].sort();

    return {
      generation: driverActiveGeneration ? { ...health.generation } : null,
      phase: health.phase,
      driverActiveGeneration,
      runtimeOperational: health.runtimePresent && health.hasStoreMsg && health.sessionLoaded,
      runtimeBridgeReady: health.bridgeReady && missingRuntimeMethods.length === 0,
      reinjectionSettled: this.pendingRuntimeRecoveryCount === 0,
      missingRuntimeMethods,
    };
  }

  async waitForOperationalReadiness(): Promise<TransportOperationalReadinessSnapshot> {
    await this.injectionController.waitForIdle();
    await this.runtimeRecoveryQueue;
    await this.injectionController.waitForIdle();
    return this.getOperationalReadinessSnapshot();
  }

  getBrowser(): IBrowser | null {
    return this.browser;
  }

  async close(): Promise<void> {
    this.disposePageListeners();
    await this.injectionController.dispose();
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.logger.info('transport_closed');
  }

  private async configurePageRuntime(page: IPage): Promise<void> {
    this.registerPageDiagnostics(page);
    await this.configureRequestInterception(page);
  }

  private async configureLaunchBootstrap(page: IPage): Promise<void> {
    const logoutSurface = getRuntimeListenerSurfaceEntry('session.logout');

    await this.injectionController.registerPersistentBinding('ProgressBarEvent', (data: { value?: number; text?: string }) => {
      const msg = `${(data.value || data.value === 0) ? `${data.value}%:\t` : ''} ${data.text ?? ''}`;
      this.logger.info('progress_bar_event', { value: data.value, text: data.text, msg });
      this.events.emit('internal_launch_progress', {
        value: data.value,
        text: data.text,
      });
    });

    await this.injectionController.registerPersistentBinding('CriticalInternalMessage', (data: { value?: string; text?: string }) => {
      this.logger.warn('critical_internal_message', { value: data.value, text: data.text });
      this.events.emit('critical_internal_message', {
        value: data.value,
        text: data.text,
      });
    });

    await this.injectionController.registerPersistentBinding('OpenWA_RuntimeReplacementDetected', () => {
      this.queueRuntimeRecovery('runtime_replaced');
    });

    this.injectionController.registerNavigationObserver(logoutSurface.observerId, (frame) => {
      const url = frame.url();
      if (!url.includes('post_logout=1')) {
        return;
      }

      this.events.emit('session.logout', {
        correlationId: 'page-post-logout',
        ts: Date.now(),
        step: 'session_logout',
        details: { reason: 'post_logout=1' },
      });
    });

    this.injectionController.registerNavigationObserver('runtime.navigation_recovery', (_frame, generation) => {
      this.queueRuntimeRecovery('main_frame_navigation', generation);
    });

    await this.injectionController.registerPersistentInitScript('prog_observer', await getProgObserverScript());
    await this.injectionController.registerPersistentInitScript('runtime_replacement_observer', RUNTIME_REPLACEMENT_OBSERVER_SCRIPT);
    await this.injectionController.initialize(page);

    this.logger.debug('exposed_page_callbacks', {
      functions: ['ProgressBarEvent', 'CriticalInternalMessage', 'OpenWA_RuntimeReplacementDetected'],
    });
    this.logger.info('prog_observer_registered_post_navigation');
  }

  private async runPreApiHelperPhase(): Promise<void> {
    const helpersReady = await this.evaluateBooleanScript(PRE_API_HELPER_READY_CHECK_SCRIPT).catch(() => false);

    this.events.emit('launch.helper.pre_api.before', {
      correlationId: 'transport-pre-api-helper',
      ts: Date.now(),
      step: 'pre_api_helper_phase',
      details: { mode: helpersReady ? 'noop' : 'scripts' },
    });

    const wapiScript = await Transport.getAssetScript('wapi.js');
    const audit = auditWapiHelperAssetRequirements(wapiScript);

    if (audit.forbiddenMatches.length > 0) {
      throw new Error(`wapi.js still depends on legacy helper globals: ${audit.forbiddenMatches.join(', ')}`);
    }

    if (audit.requiredLegacyHelpers.length > 0) {
      throw new Error(`Legacy pre-api helper phase is required but not implemented for: ${audit.requiredLegacyHelpers.join(', ')}`);
    }

    if (!helpersReady) {
      const helperAssets: Array<'qr.min.js' | 'hash.js'> = ['qr.min.js', 'hash.js'];
      for (const asset of helperAssets) {
        const assetPath = Transport.resolveAssetPath(asset);
        const helperScript = await Transport.getAssetScript(asset);
        this.logger.info('transport_injection_asset_evaluating', {
          asset,
          assetPath,
          bytes: helperScript.length,
        });
        await this.page!.evaluateScript(helperScript);
      }
    }

    this.logger.info('pre_api_helper_phase_complete', {
      mode: helpersReady ? 'noop' : 'scripts',
      requiredLegacyHelpers: audit.requiredLegacyHelpers,
    });

    this.events.emit('launch.helper.pre_api.after', {
      correlationId: 'transport-pre-api-helper',
      ts: Date.now(),
      step: 'pre_api_helper_phase',
      details: {
        mode: helpersReady ? 'noop' : 'scripts',
        success: true,
        requiredLegacyHelpers: audit.requiredLegacyHelpers,
      },
    });
  }

  private registerPageDiagnostics(page: IPage): void {
    this.disposePageListeners();

    this.pageListeners.push(
      page.on('console', (message) => this.handleConsoleMessage(message)),
      page.on('pageerror', (error) => this.handlePageError(error)),
    );
  }

  private async configureRequestInterception(page: IPage): Promise<void> {
    const shouldBlockAssets = this.headless && this.blockAssets;
    const shouldEnableInterception = this.blockCrashLogs || shouldBlockAssets;

    this.events.emit('launch.page.interception.before', {
      correlationId: 'transport-page-interception',
      ts: Date.now(),
      step: 'page_interception',
      details: { enabled: shouldEnableInterception },
    });

    if (!shouldEnableInterception) {
      this.events.emit('launch.page.interception.after', {
        correlationId: 'transport-page-interception',
        ts: Date.now(),
        step: 'page_interception',
        details: {},
      });
      return;
    }

    try {
      await page.setRequestInterception(true);
      this.pageListeners.push(page.on('request', (request) => this.handleInterceptedRequest(request)));
      this.logger.info('page_request_interception_enabled', {
        blockCrashLogs: this.blockCrashLogs,
        blockAssets: shouldBlockAssets,
        safeMode: this.safeMode,
      });
    } catch (error) {
      this.logger.warn('page_request_interception_unavailable', {
        error: error instanceof Error ? error.message : String(error),
        blockCrashLogs: this.blockCrashLogs,
        blockAssets: shouldBlockAssets,
        safeMode: this.safeMode,
      });
    } finally {
      this.events.emit('launch.page.interception.after', {
        correlationId: 'transport-page-interception',
        ts: Date.now(),
        step: 'page_interception',
        details: {},
      });
    }
  }

  private handleConsoleMessage(message: IConsoleMessage): void {
    const meta = {
      type: message.type(),
      text: message.text(),
      location: message.location?.(),
    };

    if (this.logConsole) {
      console.log(message.text());
    }

    this.logger.info('page_console', meta);
  }

  private handlePageError(error: Error): void {
    if (this.logConsoleErrors) {
      console.error(error);
    }

    this.logger.error('page_console_error', {
      message: error.message,
      stack: error.stack,
    });
  }

  private async handleInterceptedRequest(request: IRequest): Promise<void> {
    const shouldBlockAssets = this.headless && this.blockAssets;
    const url = request.url();
    const resourceType = request.resourceType();

    if (this.blockCrashLogs && CRASH_LOG_URL_FRAGMENTS.some((fragment) => url.includes(fragment))) {
      await request.abort();
      return;
    }

    if (shouldBlockAssets && resourceType && BLOCKED_ASSET_RESOURCE_TYPES.has(resourceType)) {
      await request.abort();
      return;
    }

    await request.continue();
  }

  private disposePageListeners(): void {
    const handles = this.pageListeners.splice(0, this.pageListeners.length);
    for (const handle of handles) {
      void Promise.resolve(handle.dispose()).catch(() => undefined);
    }
  }

  private static async getAssetScript(assetFileName: 'launch.js' | 'wapi.js' | 'qr.min.js' | 'hash.js'): Promise<string> {
    const cached = Transport.assetScriptCache.get(assetFileName);
    if (cached) {
      return cached;
    }

    const scriptPromise = readFile(Transport.resolveAssetPath(assetFileName), 'utf8');
    Transport.assetScriptCache.set(assetFileName, scriptPromise);
    return scriptPromise;
  }

  private static resolveAssetPath(assetFileName: 'launch.js' | 'wapi.js' | 'qr.min.js' | 'hash.js'): string {
    const moduleDir = Transport.resolveCurrentModuleDir();
    const candidates = [
      join(moduleDir, 'assets', assetFileName),
      join(moduleDir, 'transport/assets', assetFileName),
    ];

    const match = candidates.find((candidate) => existsSync(candidate));
    if (!match) {
      throw new Error(`Unable to resolve ${assetFileName} for runtime activation from module-relative candidates: ${candidates.join(', ')}`);
    }

    return match;
  }

  static resolveLaunchScriptPath(): string {
    return Transport.resolveAssetPath('launch.js');
  }

  static resolveWapiScriptPath(): string {
    return Transport.resolveAssetPath('wapi.js');
  }

  private static resolveCurrentModuleDir(): string {
    const originalPrepareStackTrace = Error.prepareStackTrace;

    try {
      Error.prepareStackTrace = (_error, stack) => stack;
      const stack = new Error().stack as unknown as NodeJS.CallSite[] | undefined;
      const fileName = stack
        ?.map((callSite) => callSite.getFileName())
        .find((candidate): candidate is string => (
          typeof candidate === 'string'
          && candidate.length > 0
          && !candidate.startsWith('node:')
          && !candidate.startsWith('[')
          && !candidate.includes('/[eval]')
          && !candidate.includes('\[eval]')
        ));

      if (!fileName) {
        throw new Error('Unable to determine current module path for launch.js resolution');
      }

      return dirname(fileName);
    } finally {
      Error.prepareStackTrace = originalPrepareStackTrace;
    }
  }

  private async evaluateBooleanScript(script: string): Promise<boolean> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    return Boolean(await this.page.evaluateScript<boolean>(script));
  }

  private queueRuntimeRecovery(
    trigger: 'main_frame_navigation' | 'runtime_replaced',
    generation?: GenerationSnapshot,
  ): void {
    const requestId = ++this.latestRuntimeRecoveryRequestId;
    this.pendingRuntimeRecoveryCount += 1;

    this.runtimeRecoveryQueue = this.runtimeRecoveryQueue.then(
      () => this.runRuntimeRecovery({ requestId, trigger, generation }),
      () => this.runRuntimeRecovery({ requestId, trigger, generation }),
    ).catch((error) => {
      this.logger.warn('runtime_recovery_failed', {
        trigger,
        requestId: String(requestId),
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  private isLatestRuntimeRecoveryRequest(requestId: number): boolean {
    return requestId === this.latestRuntimeRecoveryRequestId;
  }

  private async runRuntimeRecovery(request: {
    requestId: number;
    trigger: 'main_frame_navigation' | 'runtime_replaced';
    generation?: GenerationSnapshot;
  }): Promise<void> {
    try {
      if (!this.page) {
        return;
      }

      const settledGeneration = await this.injectionController.waitForIdle();
      if (!this.isLatestRuntimeRecoveryRequest(request.requestId)) {
        this.logger.debug('runtime_recovery_dropped_stale_request', {
          trigger: request.trigger,
          requestId: String(request.requestId),
          latestRequestId: String(this.latestRuntimeRecoveryRequestId),
        });
        return;
      }

      if (
        request.generation
        && request.generation.documentId !== settledGeneration.documentId
      ) {
        this.logger.debug('runtime_recovery_generation_superseded', {
          trigger: request.trigger,
          requestDocumentId: request.generation.documentId,
          settledDocumentId: settledGeneration.documentId,
        });
        return;
      }

      await this.waitForFunctionProbe(DOCUMENT_READY_CHECK_SCRIPT, {
        timeoutMs: 3000,
        polling: 'mutation',
      });

      if (!this.isLatestRuntimeRecoveryRequest(request.requestId)) {
        return;
      }

      const { reinjected } = await this.recoverRuntimeForCurrentDocument({
        trigger: request.trigger,
        shouldContinue: () => this.isLatestRuntimeRecoveryRequest(request.requestId),
      });

      this.logger.info('runtime_recovery_completed', {
        trigger: request.trigger,
        requestId: String(request.requestId),
        reinjected,
        generation: settledGeneration,
      });
    } finally {
      this.pendingRuntimeRecoveryCount = Math.max(0, this.pendingRuntimeRecoveryCount - 1);
    }
  }

  private async recoverRuntimeForCurrentDocument(options: {
    trigger: 'main_frame_navigation' | 'runtime_replaced' | 'post_authentication' | 'validation_failure';
    shouldContinue?: () => boolean;
    forceReinject?: boolean;
  }): Promise<{ capability: RuntimeCapabilityProbe; reinjected: boolean }> {
    const shouldContinue = options.shouldContinue ?? (() => true);

    let capability = await this.probeRuntimeCapability();
    if (!shouldContinue()) {
      return { capability, reinjected: false };
    }

    if (!options.forceReinject && capability.hasRuntime) {
      const bridgeReady = await this.injectionController.ensureRuntimeBridge();
      if (!shouldContinue()) {
        return { capability, reinjected: false };
      }

      if (bridgeReady) {
        this.logger.info('runtime_recovery_completed_without_reinject', {
          trigger: options.trigger,
        });
        return { capability, reinjected: false };
      }
    }

    const reinjected = await this.performRuntimeInjection(shouldContinue);
    capability = await this.probeRuntimeCapability();

    return {
      capability,
      reinjected,
    };
  }

  private async performRuntimeInjection(shouldContinue: () => boolean = () => true): Promise<boolean> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    const wapiAssetPath = Transport.resolveWapiScriptPath();
    const wapiScript = await Transport.getAssetScript('wapi.js');
    this.logger.info('transport_injection_asset_evaluating', {
      asset: 'wapi.js',
      assetPath: wapiAssetPath,
      bytes: wapiScript.length,
    });
    await this.page.evaluateScript(wapiScript);

    await this.waitForFunctionProbe(WAPI_RUNTIME_CHECK_SCRIPT, { timeoutMs: 3000, polling: 50 });
    if (!shouldContinue()) {
      return false;
    }

    let capability = await this.probeRuntimeCapability();

    if (!capability.hasRuntime) {
      this.logger.warn('wapi_bootstrap_missing_runtime_after_wapi_asset');
    }

    const launchAssetPath = Transport.resolveLaunchScriptPath();
    const launchScript = await Transport.getAssetScript('launch.js');
    this.logger.info('transport_injection_asset_evaluating', {
      asset: 'launch.js',
      assetPath: launchAssetPath,
      bytes: launchScript.length,
    });
    await this.page.evaluateScript(launchScript);

    await this.waitForFunctionProbe(WAPI_RUNTIME_CHECK_SCRIPT, { timeoutMs: 3000, polling: 50 });
    if (!shouldContinue()) {
      return false;
    }

    capability = await this.probeRuntimeCapability();

    if (!capability.hasRuntime) {
      this.logger.warn('wapi_bootstrap_missing_runtime_after_launch_asset');
    }

    const success = capability.hasRuntime;

    this.logger.info('wapi_injection_probe', { ...capability });

    return success;
  }

  private async probeBrokenMethodIntegrity(): Promise<RuntimeMethodIntegrityResult> {
    const requiredMethods = this.injectionController.getRequiredRuntimeMethods();
    const bridgeReady = await this.injectionController.ensureRuntimeBridge();
    const health = this.injectionController.getHealthSnapshot();

    return {
      bridgeReady,
      requiredMethods,
      missingMethods: health.missingRuntimeMethods,
    };
  }

  private async waitForFunctionProbe(
    script: string,
    options?: WaitForFunctionOptions,
  ): Promise<boolean> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }

    try {
      await this.page.waitForFunction(script, options);
      return true;
    } catch {
      return false;
    }
  }

  private async resolveLicenseKey(
    input: LicenseKeyResolver | undefined,
    sessionId: string,
  ): Promise<string | null> {
    if (!input) {
      return null;
    }

    let resolved: string | Record<string, string | undefined> | null | undefined;
    if (typeof input === 'function') {
      resolved = await input(sessionId);
    } else {
      resolved = input;
    }

    if (typeof resolved === 'object' && resolved !== null) {
      resolved = resolved[sessionId] ?? null;
    }

    if (typeof resolved !== 'string') {
      return null;
    }

    const trimmed = resolved.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private deriveLicenseKeyType(key: string): string {
    const normalizedKey = key.trim();
    const [head] = normalizedKey.split(/[-:]/);
    if (!head) {
      return 'license';
    }

    if (/^(invalid|expired)$/i.test(head)) {
      return 'license';
    }

    return head.toLowerCase();
  }

  private maskLicenseKey(key: string): string {
    if (key.length <= 4) {
      return key;
    }

    return `${'*'.repeat(Math.max(0, key.length - 4))}${key.slice(-4)}`;
  }

  private isInvalidLicenseKey(key: string): boolean {
    return /^invalid[-:]/i.test(key.trim());
  }

  private isExpiredLicenseKey(key: string): boolean {
    return /^expired[-:]/i.test(key.trim());
  }

  private buildLicensePayload(key: string, keyType: string): string {
    const safeKeyType = JSON.stringify(keyType);
    const safeMaskedKey = JSON.stringify(this.maskLicenseKey(key));

    return `(() => {
      window.__OPENWA_LICENSE__ = {
        appliedAt: Date.now(),
        mode: 'metadata_injection',
        keyType: ${safeKeyType},
        maskedKey: ${safeMaskedKey}
      };
      window.KEYTYPE = ${safeKeyType};
      window.launchError = null;
      return true;
    })();`;
  }

  // ─── Remote Patch Pipeline ────────────────────────────────────────────────

  /**
   * Fetch remote patches with disk caching.
   *
   * Strategy (mirrors legacy `getAndInjectLivePatch`):
   * 1. Try cached patches first (if < 24h old)
   * 2. If stale/missing, fetch from cdn.openwa.dev
   * 3. If CDN fails, fall back to GitHub raw
   * 4. Cache result to disk for next session
   */
  private async fetchRemotePatchesWithCache(
    sessionInfo?: SessionDebugInfo,
  ): Promise<RemotePatchFetchResult> {
    const cacheEnabled = this.patchConfig.cachedPatch === true;

    // Try disk cache first only when explicitly enabled.
    if (cacheEnabled) {
      try {
        const cached = await this.loadCachedPatches();
        if (cached) {
          this.logger.info('patches_loaded_from_cache', { tag: cached.tag, count: cached.data.length });
          void this.refreshCachedPatchInBackground(sessionInfo);
          return { data: cached.data, tag: cached.tag, source: 'cached' };
        }
      } catch (cacheError) {
        const cacheMsg = cacheError instanceof Error ? cacheError.message : String(cacheError);
        this.logger.debug('patch_cache_read_failed', { error: cacheMsg });
      }
    }

    const result = await this.fetchFreshRemotePatches(sessionInfo);
    this.logger.info('patches_fetched_from_remote', { tag: result.tag, count: result.data.length });
    return { data: result.data, tag: result.tag, source: 'remote' };
  }

  private async refreshCachedPatchInBackground(sessionInfo?: SessionDebugInfo): Promise<void> {
    try {
      const result = await this.fetchFreshRemotePatches(sessionInfo);
      this.logger.debug('patch_cache_refreshed_in_background', { tag: result.tag, count: result.data.length });
    } catch (refreshError) {
      const refreshMsg = refreshError instanceof Error ? refreshError.message : String(refreshError);
      this.logger.debug('patch_cache_background_refresh_failed', { error: refreshMsg });
    }
  }

  private async fetchFreshRemotePatches(sessionInfo?: SessionDebugInfo): Promise<{ data: string[]; tag: string }> {
    const patchesUrl = this.patchConfig.patchesUrl ?? DEFAULT_PATCHES_URL;
    const useGithubPrimary = this.patchConfig.ghPatch === true;
    const primaryUrl = useGithubPrimary ? GH_PATCHES_FALLBACK_URL : patchesUrl;
    const fallbackUrl = useGithubPrimary
      ? undefined
      : this.patchConfig.ghPatchFallback === false
        ? undefined
        : GH_PATCHES_FALLBACK_URL;

    const result = await fetchPatches(
      primaryUrl,
      {
        waVersion: sessionInfo?.WA_VERSION,
        waAutomateVersion: sessionInfo?.WA_AUTOMATE_VERSION,
      },
      { fallbackUrl },
    );

    if (this.patchConfig.cachedPatch === true) {
      try {
        await this.saveCachedPatches(result);
        this.logger.debug('patches_saved_to_cache', { tag: result.tag, count: result.data.length });
      } catch (saveError) {
        const saveMsg = saveError instanceof Error ? saveError.message : String(saveError);
        this.logger.debug('patch_cache_write_failed', { error: saveMsg });
      }
    }

    return result;
  }

  private async loadCachedPatches(): Promise<{ data: string[]; tag: string } | null> {
    const cachePath = join(process.cwd(), PATCH_CACHE_FILENAME);

    if (!existsSync(cachePath)) {
      return null;
    }

    // Check staleness
    const fileStat = await stat(cachePath);
    if (Date.now() - fileStat.mtime.getTime() > PATCH_CACHE_MAX_AGE_MS) {
      this.logger.debug('patch_cache_stale', { ageMs: Date.now() - fileStat.mtime.getTime() });
      return null;
    }

    const raw = await readFile(cachePath, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.tag !== 'string') {
      return null;
    }

    return { data: parsed.data, tag: parsed.tag };
  }

  private async saveCachedPatches(result: { data: string[]; tag: string }): Promise<void> {
    const cachePath = join(process.cwd(), PATCH_CACHE_FILENAME);
    await writeFile(cachePath, JSON.stringify({ data: result.data, tag: result.tag }), 'utf-8');
  }

  // ─── Session Debug Info ───────────────────────────────────────────────────

  /**
   * Extract session debug info from the authenticated browser page.
   *
   * Must be called AFTER authentication completes and the WhatsApp runtime is available.
   * Returns the data needed for remote overlay requests (patch params + license validation body).
   *
   * Mirrors legacy `WAPI.getMe()._serialized` + session debug info collection.
   */
  async getSessionDebugInfo(): Promise<SessionDebugInfo> {
    if (!this.page) {
      throw new Error('Transport not initialized — cannot extract session debug info');
    }

    const info = await this.page.evaluate(
      () => ({
        waVersion: (globalThis as any).Debug?.VERSION ?? 'unknown',
        hostNumber: (globalThis as any).Store?.Conn?.me?._serialized ?? '',
        pageUA: navigator.userAgent,
        os: navigator.platform ?? 'unknown',
      }),
      undefined,
    );

    const hostNumber = info.hostNumber ?? '';
    const numHash = hostNumber
      ? createHash('md5').update(hostNumber).digest('hex').slice(-5)
      : undefined;

    return {
      WA_VERSION: info.waVersion,
      WA_AUTOMATE_VERSION: '5.0.0',
      hostNumber,
      BROWSER_VERSION: info.pageUA,
      PAGE_UA: info.pageUA,
      OS: info.os,
      NUM_HASH: numHash,
    };
  }
}
