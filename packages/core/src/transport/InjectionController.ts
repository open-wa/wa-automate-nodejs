import type { DisposableHandle, IFrame, IPage } from '@open-wa/driver-interface';
import type { Logger } from '@open-wa/logger';

export type InjectionPhase =
  | 'idle'
  | 'bindings_registered'
  | 'preload_registered'
  | 'document_observed'
  | 'runtime_detected'
  | 'store_detected'
  | 'session_ready'
  | 'patches_applied'
  | 'bridge_ready'
  | 'degraded'
  | 'disposed';

export interface GenerationRef {
  browserContextId: string;
  documentId: string;
  runtimeId: string | null;
}

export interface RuntimeHealth {
  generation: GenerationRef;
  phase: InjectionPhase;
  bridgeBound: boolean;
  preloadRegistered: boolean;
  runtimePresent: boolean;
  storePresent: boolean;
  hasStoreMsg: boolean;
  sessionLoaded: boolean;
  bridgeReady: boolean;
  requiredRuntimeMethods: string[];
  missingRuntimeMethods: string[];
  appliedPatchIds: string[];
  degradedReasons: string[];
  lastError?: {
    message: string;
    stack?: string;
    ts: number;
  };
}

export type GenerationSnapshot = GenerationRef;

interface PersistentBindingRegistration {
  name: string;
  handler: (...args: any[]) => any;
  required: boolean;
  installed: boolean;
}

interface PersistentInitScriptRegistration {
  id: string;
  script: string;
  required: boolean;
  handle: DisposableHandle | null;
}

interface RuntimeBridgeRegistration {
  id: string;
  bindingName: string;
  wapiMethod: string;
  required: boolean;
  boundRuntimeId: string | null;
}

interface RuntimeBridgeCleanupHandle extends DisposableHandle {
  readonly runtimeId: string;
}

interface NavigationObserverRegistration {
  id: string;
  handler: (frame: IFrame, generation: GenerationSnapshot) => Promise<void> | void;
}

interface RuntimeBridgeProbeResult {
  hasRuntime: boolean;
  hasStoreMsg: boolean;
  sessionLoaded: boolean;
}

interface RuntimeBridgeInstallResult {
  status: 'registered' | 'already_registered' | 'missing_runtime' | 'missing_method' | 'failed';
  error?: string;
  errorStack?: string;
}

interface RegistrationFailureContext {
  bridgeId?: string;
  bindingName?: string;
  wapiMethod?: string;
  runtimeId?: string;
  installStatus?: RuntimeBridgeInstallResult['status'];
  installError?: string;
  installErrorStack?: string;
  runtimeAsset?: string;
}

function createGenerationToken(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function createHealth(generation?: Partial<GenerationRef>): RuntimeHealth {
  return {
    generation: {
      browserContextId: generation?.browserContextId ?? createGenerationToken('ctx'),
      documentId: generation?.documentId ?? createGenerationToken('doc'),
      runtimeId: generation?.runtimeId ?? null,
    },
    phase: 'idle',
    bridgeBound: false,
    preloadRegistered: false,
    runtimePresent: false,
    storePresent: false,
    hasStoreMsg: false,
    sessionLoaded: false,
    bridgeReady: false,
    requiredRuntimeMethods: [],
    missingRuntimeMethods: [],
    appliedPatchIds: [],
    degradedReasons: [],
  };
}

export class DisposableRegistry {
  private readonly handles = new Set<DisposableHandle>();

  add<T extends DisposableHandle>(handle: T): T {
    this.handles.add(handle);
    return handle;
  }

  async disposeAll(): Promise<void> {
    const handles = [...this.handles];
    this.handles.clear();
    await Promise.allSettled(handles.map((handle) => Promise.resolve(handle.dispose())));
  }
}

export class InjectionController {
  private page: IPage | null = null;
  private readonly pageRegistry = new DisposableRegistry();
  private readonly runtimeRegistry = new DisposableRegistry();
  private readonly bridgeRegistry = new DisposableRegistry();
  private readonly persistentBindings = new Map<string, PersistentBindingRegistration>();
  private readonly persistentInitScripts = new Map<string, PersistentInitScriptRegistration>();
  private readonly runtimeBridges = new Map<string, RuntimeBridgeRegistration>();
  private readonly navigationObservers = new Map<string, NavigationObserverRegistration>();
  private lifecycleQueue: Promise<void> = Promise.resolve();
  private health: RuntimeHealth = createHealth();
  private activeBridgeCleanupRuntimeId: string | null = null;
  private readonly runtimeBridgeResetTimeoutMs = 1_500;

  constructor(private readonly logger: Pick<Logger, 'debug' | 'warn'>) { }

  async registerPersistentBinding(
    name: string,
    handler: (...args: any[]) => any,
    options: { required?: boolean } = {},
  ): Promise<void> {
    const existing = this.persistentBindings.get(name);
    if (existing) {
      existing.handler = handler;
      existing.required = options.required ?? existing.required;
      existing.installed = false;
    } else {
      this.persistentBindings.set(name, {
        name,
        handler,
        required: options.required ?? false,
        installed: false,
      });
    }

    if (this.page) {
      await this.installPersistentBinding(this.persistentBindings.get(name)!);
      this.refreshPersistentRegistrationState();
    }
  }

  async registerPersistentInitScript(
    id: string,
    script: string,
    options: { required?: boolean } = {},
  ): Promise<void> {
    const existing = this.persistentInitScripts.get(id);

    if (existing) {
      if (existing.handle) {
        await Promise.resolve(existing.handle.dispose());
      }

      existing.script = script;
      existing.required = options.required ?? existing.required;
      existing.handle = null;
    } else {
      this.persistentInitScripts.set(id, {
        id,
        script,
        required: options.required ?? false,
        handle: null,
      });
    }

    if (this.page) {
      await this.installPersistentInitScript(this.persistentInitScripts.get(id)!);
      this.refreshPersistentRegistrationState();
    }
  }

  async registerRuntimeWapiBridge(
    id: string,
    bindingName: string,
    handler: (...args: any[]) => any,
    options: { wapiMethod: string; required?: boolean },
  ): Promise<void> {
    await this.registerPersistentBinding(bindingName, handler, { required: options.required });

    const existing = this.runtimeBridges.get(id);
    if (existing) {
      existing.bindingName = bindingName;
      existing.wapiMethod = options.wapiMethod;
      existing.required = options.required ?? existing.required;
      existing.boundRuntimeId = null;
      return;
    }

    this.runtimeBridges.set(id, {
      id,
      bindingName,
      wapiMethod: options.wapiMethod,
      required: options.required ?? false,
      boundRuntimeId: null,
    });
  }

  registerNavigationObserver(
    id: string,
    handler: (frame: IFrame, generation: GenerationSnapshot) => Promise<void> | void,
  ): void {
    this.navigationObservers.set(id, { id, handler });
  }

  getRequiredRuntimeMethods(): string[] {
    return [...new Set(
      [...this.runtimeBridges.values()]
        .filter((bridge) => bridge.required)
        .map((bridge) => bridge.wapiMethod)
    )].sort();
  }

  async ensureRuntimeBridge(): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    this.resetRuntimeBridgeDegradation();

    const probe = await this.probeRuntimeBridgeState();
    const runtimeId = this.ensureRuntimeId();
    const registeredRuntimeBridges = [...this.runtimeBridges.values()];
    const requiredRuntimeMethods = this.getRequiredRuntimeMethods();
    const missingRuntimeMethods = new Set<string>();

    this.health = {
      ...this.health,
      runtimePresent: probe.hasRuntime,
      storePresent: probe.hasStoreMsg,
      hasStoreMsg: probe.hasStoreMsg,
      sessionLoaded: probe.sessionLoaded,
      bridgeReady: false,
      requiredRuntimeMethods,
      missingRuntimeMethods: [],
      phase: this.deriveRuntimePhase({
        ...probe,
        bridgeReady: false,
      }),
    };

    if (!probe.hasRuntime) {
      return false;
    }

    if (registeredRuntimeBridges.length === 0) {
      this.health = {
        ...this.health,
        bridgeReady: true,
        requiredRuntimeMethods,
        missingRuntimeMethods: [],
        phase: this.deriveRuntimePhase({
          ...probe,
          bridgeReady: true,
        }),
      };

      return true;
    }

    let allRequiredBound = true;
    let anyBridgeBound = false;

    for (const bridge of registeredRuntimeBridges) {
      const result = await this.installRuntimeBridge(bridge, runtimeId);

      if (result.status === 'registered' || result.status === 'already_registered') {
        anyBridgeBound = true;
        bridge.boundRuntimeId = runtimeId;
        continue;
      }

      bridge.boundRuntimeId = null;

        if (bridge.required) {
          allRequiredBound = false;
          if (result.status === 'missing_method') {
            missingRuntimeMethods.add(bridge.wapiMethod);
          }
          this.noteRegistrationFailure(
            `runtime_bridge:${bridge.id}`,
            new Error(result.error ?? result.status),
            true,
            {
              bridgeId: bridge.id,
              bindingName: bridge.bindingName,
              wapiMethod: bridge.wapiMethod,
              runtimeId,
              installStatus: result.status,
              installError: result.error,
              installErrorStack: result.errorStack,
              runtimeAsset: 'wapi.js',
            },
          );
        }
      }

    if (anyBridgeBound) {
      await this.ensureBridgeCleanupHandle(runtimeId);
    }

    const requiredBridges = registeredRuntimeBridges.filter((bridge) => bridge.required);
    const bridgeReady = requiredBridges.length > 0
      ? allRequiredBound
      : anyBridgeBound;

    this.health = {
      ...this.health,
      bridgeReady,
      requiredRuntimeMethods,
      missingRuntimeMethods: [...missingRuntimeMethods].sort(),
      phase: this.deriveRuntimePhase({
        ...probe,
        bridgeReady,
      }),
    };

    return bridgeReady;
  }

  async rolloverRuntimeGeneration(): Promise<GenerationSnapshot> {
    this.clearRuntimeBridgeState();
    await this.runtimeRegistry.disposeAll();
    await this.disposeBridgeRegistry();

    const runtimeId = createGenerationToken('rt');
    this.health = {
      ...this.health,
      generation: {
        ...this.health.generation,
        runtimeId,
      },
      bridgeReady: false,
      phase: this.deriveRuntimePhase({
        hasRuntime: this.health.runtimePresent,
        hasStoreMsg: this.health.hasStoreMsg,
        sessionLoaded: this.health.sessionLoaded,
        bridgeReady: false,
      }),
    };

    return this.captureGenerationSnapshot();
  }

  async initialize(page: IPage): Promise<void> {
    if (this.page && this.page !== page) {
      await this.disposePageInfrastructure();
    }

    this.page = page;
    this.bumpBrowserContextGeneration();
    await this.installPersistentInfrastructure();
    this.attachPageLifecycle(page);
  }

  captureGenerationSnapshot(): GenerationSnapshot {
    return { ...this.health.generation };
  }

  isCurrentGeneration(snapshot: GenerationSnapshot): boolean {
    return (
      snapshot.browserContextId === this.health.generation.browserContextId
      && snapshot.documentId === this.health.generation.documentId
      && snapshot.runtimeId === this.health.generation.runtimeId
    );
  }

  getHealthSnapshot(): RuntimeHealth {
    return {
      ...this.health,
      generation: { ...this.health.generation },
      appliedPatchIds: [...this.health.appliedPatchIds],
      requiredRuntimeMethods: [...this.health.requiredRuntimeMethods],
      missingRuntimeMethods: [...this.health.missingRuntimeMethods],
      degradedReasons: [...this.health.degradedReasons],
      lastError: this.health.lastError ? { ...this.health.lastError } : undefined,
    };
  }

  async enqueue(task: () => Promise<void>): Promise<void> {
    this.lifecycleQueue = this.lifecycleQueue.then(task, task);
    return this.lifecycleQueue;
  }

  async waitForIdle(): Promise<GenerationSnapshot> {
    await this.enqueue(async () => undefined);
    return this.captureGenerationSnapshot();
  }

  async dispose(): Promise<void> {
    await this.disposePageInfrastructure();
    this.page = null;
    this.health = {
      ...this.health,
      phase: 'disposed',
    };
  }

  private async installPersistentInfrastructure(): Promise<void> {
    await this.installPersistentBindings();
    await this.installPersistentInitScripts();
    this.refreshPersistentRegistrationState();
  }

  private async installPersistentBindings(): Promise<void> {
    for (const binding of this.persistentBindings.values()) {
      await this.installPersistentBinding(binding);
    }
  }

  private async installPersistentBinding(binding: PersistentBindingRegistration): Promise<void> {
    if (!this.page || binding.installed) {
      return;
    }

    try {
      await this.page.exposeFunction(binding.name, binding.handler);
      binding.installed = true;
      this.logger.debug('injection_controller_binding_registered', {
        binding: binding.name,
        generation: this.health.generation.browserContextId,
      });
    } catch (error) {
      binding.installed = false;
      this.noteRegistrationFailure(`binding:${binding.name}`, error, binding.required);
    }
  }

  private async installPersistentInitScripts(): Promise<void> {
    for (const registration of this.persistentInitScripts.values()) {
      await this.installPersistentInitScript(registration);
    }
  }

  private async installPersistentInitScript(registration: PersistentInitScriptRegistration): Promise<void> {
    if (!this.page || registration.handle) {
      return;
    }

    try {
      registration.handle = await this.page.addInitScript(registration.script);

      this.logger.debug('injection_controller_init_script_registered', {
        initScript: registration.id,
        generation: this.health.generation.browserContextId,
      });
    } catch (error) {
      registration.handle = null;
      this.noteRegistrationFailure(`init:${registration.id}`, error, registration.required);
    }
  }

  private attachPageLifecycle(page: IPage): void {
    this.pageRegistry.add(
      page.on('framenavigated', (frame) => {
        if (!this.isMainFrame(frame)) {
          return;
        }

        void this.enqueue(async () => {
          this.bumpDocumentGeneration();
          this.clearRuntimeBridgeState();
          await this.runtimeRegistry.disposeAll();
          await this.disposeBridgeRegistry();
          const generation = this.captureGenerationSnapshot();
          await this.notifyNavigationObservers(frame, generation);
        }).catch((error) => {
          this.logger.warn('injection_controller_lifecycle_task_failed', {
            phase: 'framenavigated',
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }),
    );
  }

  private async disposePageInfrastructure(): Promise<void> {
    await this.pageRegistry.disposeAll();
    await this.runtimeRegistry.disposeAll();
    await this.disposeBridgeRegistry();

    const initScripts = [...this.persistentInitScripts.values()];
    await Promise.allSettled(
      initScripts
        .filter((registration) => registration.handle)
        .map(async (registration) => {
          await Promise.resolve(registration.handle?.dispose());
          registration.handle = null;
        }),
    );

    for (const binding of this.persistentBindings.values()) {
      binding.installed = false;
    }

    this.clearRuntimeBridgeState();
  }

  private async ensureBridgeCleanupHandle(runtimeId: string): Promise<void> {
    if (this.activeBridgeCleanupRuntimeId === runtimeId) {
      return;
    }

    await this.disposeBridgeRegistry();
    this.bridgeRegistry.add(this.createBridgeCleanupHandle(runtimeId));
    this.activeBridgeCleanupRuntimeId = runtimeId;
  }

  private async disposeBridgeRegistry(): Promise<void> {
    await this.bridgeRegistry.disposeAll();
    this.activeBridgeCleanupRuntimeId = null;
  }

  private createBridgeCleanupHandle(runtimeId: string): RuntimeBridgeCleanupHandle {
    return {
      runtimeId,
      dispose: () => this.resetPageRuntimeBridgeState(`runtime_cleanup:${runtimeId}`),
    };
  }

  private async resetPageRuntimeBridgeState(reason: string): Promise<void> {
    if (!this.page) {
      return;
    }

    const cleanupPromise = this.page.evaluate(({ reason: resetReason }) => {
      const root = globalThis as typeof globalThis & {
        __OPENWA_RUNTIME_BRIDGE__?: {
          runtimeId: string | null;
          runtimeRef: unknown;
          listeners: Record<string, { dispose?: (() => unknown) | undefined }>;
          lastResetAt?: number;
          lastResetReason?: string;
        };
      };

      const state = root.__OPENWA_RUNTIME_BRIDGE__;
      if (!state) {
        return;
      }

      for (const listener of Object.values(state.listeners ?? {})) {
        try {
          listener.dispose?.();
        } catch {
          // Ignore page-side listener cleanup failures during reset.
        }
      }

      state.runtimeId = null;
      state.runtimeRef = null;
      state.listeners = {};
      state.lastResetAt = Date.now();
      state.lastResetReason = resetReason;
      root.__OPENWA_RUNTIME_BRIDGE__ = state;
    }, { reason });

    try {
      let cleanupError: unknown;
      const guardedCleanupPromise = cleanupPromise.catch((error) => {
        cleanupError = error;
      });

      await Promise.race([
        guardedCleanupPromise,
        new Promise<void>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`runtime_bridge_reset_timeout:${this.runtimeBridgeResetTimeoutMs}`));
          }, this.runtimeBridgeResetTimeoutMs);
        }),
      ]);

      if (cleanupError) {
        throw cleanupError;
      }
    } catch (error) {
      this.logger.warn('injection_controller_runtime_bridge_reset_failed', {
        reason,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private refreshPersistentRegistrationState(): void {
    const requiredBindings = [...this.persistentBindings.values()].filter((binding) => binding.required);
    const requiredInitScripts = [...this.persistentInitScripts.values()].filter((script) => script.required);
    const optionalBindingsInstalled = [...this.persistentBindings.values()].some((binding) => binding.installed);
    const optionalInitScriptsInstalled = [...this.persistentInitScripts.values()].some((script) => Boolean(script.handle));

    const bridgeBound = requiredBindings.length > 0
      ? requiredBindings.every((binding) => binding.installed)
      : optionalBindingsInstalled;

    const preloadRegistered = requiredInitScripts.length > 0
      ? requiredInitScripts.every((script) => Boolean(script.handle))
      : optionalInitScriptsInstalled;

    this.health = {
      ...this.health,
      bridgeBound,
      preloadRegistered,
      phase: this.derivePhase(bridgeBound, preloadRegistered),
    };
  }

  private derivePhase(bridgeBound: boolean, preloadRegistered: boolean): InjectionPhase {
    if (this.health.phase === 'disposed') {
      return 'disposed';
    }

    if (this.health.degradedReasons.length > 0) {
      return 'degraded';
    }

    if (preloadRegistered) {
      return 'preload_registered';
    }

    if (bridgeBound) {
      return 'bindings_registered';
    }

    return 'idle';
  }

  private bumpBrowserContextGeneration(): void {
    this.clearRuntimeBridgeState();
    this.health = createHealth({
      browserContextId: createGenerationToken('ctx'),
      documentId: createGenerationToken('doc'),
      runtimeId: null,
    });
  }

  private bumpDocumentGeneration(): void {
    this.health = {
      ...createHealth({
        browserContextId: this.health.generation.browserContextId,
        documentId: createGenerationToken('doc'),
        runtimeId: null,
      }),
      bridgeBound: this.health.bridgeBound,
      preloadRegistered: this.health.preloadRegistered,
      phase: 'document_observed',
      degradedReasons: [...this.health.degradedReasons],
      lastError: this.health.lastError ? { ...this.health.lastError } : undefined,
    };
  }

  private clearRuntimeBridgeState(): void {
    for (const bridge of this.runtimeBridges.values()) {
      bridge.boundRuntimeId = null;
    }

    this.health = {
      ...this.health,
      bridgeReady: false,
      missingRuntimeMethods: [],
    };
  }

  private resetRuntimeBridgeDegradation(): void {
    const degradedReasons = this.health.degradedReasons.filter(
      (reason) => !reason.startsWith('runtime_bridge:')
    );

    this.health = {
      ...this.health,
      degradedReasons,
      missingRuntimeMethods: [],
      lastError: degradedReasons.length > 0 ? this.health.lastError : undefined,
    };
  }

  private ensureRuntimeId(): string {
    const existingRuntimeId = this.health.generation.runtimeId;
    if (existingRuntimeId) {
      return existingRuntimeId;
    }

    const runtimeId = createGenerationToken('rt');
    this.health = {
      ...this.health,
      generation: {
        ...this.health.generation,
        runtimeId,
      },
    };

    return runtimeId;
  }

  private async probeRuntimeBridgeState(): Promise<RuntimeBridgeProbeResult> {
    if (!this.page) {
      return {
        hasRuntime: false,
        hasStoreMsg: false,
        sessionLoaded: false,
      };
    }

    return this.page.evaluate(() => {
      const root = globalThis as typeof globalThis & {
        WAPI?: Record<string, unknown>;
        Store?: { Msg?: unknown };
        isSessionLoaded?: () => boolean;
        WA_AUTHENTICATED?: boolean;
        document?: { querySelector?: (selector: string) => unknown };
      };

      const hasRuntime = Boolean(root.WAPI);
      const hasStoreMsg = Boolean(root.Store && root.Store.Msg);
      const sessionLoaded = Boolean(
        (typeof root.isSessionLoaded === 'function' && root.isSessionLoaded())
        || root.WA_AUTHENTICATED
        || root.document?.querySelector?.('#pane-side')
        || root.document?.querySelector?.('[data-testid="chat-list-search"]')
      );

      return {
        hasRuntime,
        hasStoreMsg,
        sessionLoaded,
      };
    }, undefined);
  }

  private async installRuntimeBridge(
    bridge: RuntimeBridgeRegistration,
    runtimeId: string,
  ): Promise<RuntimeBridgeInstallResult> {
    if (!this.page) {
      return { status: 'failed', error: 'page_unavailable' };
    }

    return this.page.evaluate(({ bridgeId, bindingName, runtimeId: currentRuntimeId, wapiMethod }) => {
      const root = globalThis as typeof globalThis & {
        WAPI?: Record<string, (...args: any[]) => unknown>;
        __OPENWA_RUNTIME_BRIDGE__?: {
          runtimeId: string | null;
          runtimeRef: unknown;
          listeners: Record<string, {
            bindingName: string;
            wapiMethod: string;
            registeredAt: number;
            dispose?: (() => unknown) | undefined;
          }>;
          lastResetAt?: number;
          lastResetReason?: string;
        };
      };

      const normalizeDisposer = (value: unknown): (() => unknown) | undefined => {
        if (typeof value === 'function') {
          return value as () => unknown;
        }

        if (!value || typeof value !== 'object') {
          return undefined;
        }

        const candidate = value as Record<string, unknown>;
        for (const methodName of ['dispose', 'unsubscribe', 'off', 'remove']) {
          const method = candidate[methodName];
          if (typeof method === 'function') {
            return () => (method as () => unknown).call(value);
          }
        }

        return undefined;
      };

      const resetState = (
        state: NonNullable<typeof root.__OPENWA_RUNTIME_BRIDGE__>,
        reason: string,
      ) => {
        for (const listener of Object.values(state.listeners ?? {})) {
          try {
            listener.dispose?.();
          } catch {
            // Ignore page-side listener cleanup failures during runtime rollover.
          }
        }

        state.runtimeId = null;
        state.runtimeRef = null;
        state.listeners = {};
        state.lastResetAt = Date.now();
        state.lastResetReason = reason;
      };

      if (!root.WAPI) {
        return { status: 'missing_runtime' } satisfies RuntimeBridgeInstallResult;
      }

      const register = root.WAPI[wapiMethod];
      if (typeof register !== 'function') {
        return { status: 'missing_method' } satisfies RuntimeBridgeInstallResult;
      }

      const state = root.__OPENWA_RUNTIME_BRIDGE__ ?? {
        runtimeId: null,
        runtimeRef: null,
        listeners: {},
      };

      if (state.runtimeRef && state.runtimeRef !== root.WAPI) {
        resetState(state, 'runtime_replaced');
      }

      if (state.runtimeId && state.runtimeId !== currentRuntimeId) {
        resetState(state, 'runtime_rollover');
      }

      state.runtimeId = currentRuntimeId;
      state.runtimeRef = root.WAPI;

      if (state.listeners[bridgeId]) {
        root.__OPENWA_RUNTIME_BRIDGE__ = state;
        return { status: 'already_registered' } satisfies RuntimeBridgeInstallResult;
      }

      const exposed = (root as Record<string, unknown>)[bindingName];
      if (typeof exposed !== 'function') {
        return {
          status: 'failed',
          error: `missing_exposed_binding:${bindingName}`,
        } satisfies RuntimeBridgeInstallResult;
      }

      try {
        const result = register((payload: unknown) => (exposed as (payload: unknown) => unknown)(payload));
        if (result === false) {
          return { status: 'failed', error: `registration_returned_false:${bridgeId}` } satisfies RuntimeBridgeInstallResult;
        }

        state.listeners[bridgeId] = {
          bindingName,
          wapiMethod,
          registeredAt: Date.now(),
          dispose: normalizeDisposer(result),
        };
        root.__OPENWA_RUNTIME_BRIDGE__ = state;

        return { status: 'registered' } satisfies RuntimeBridgeInstallResult;
      } catch (error) {
        return {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        } satisfies RuntimeBridgeInstallResult;
      }
    }, {
      bridgeId: bridge.id,
      bindingName: bridge.bindingName,
      runtimeId,
      wapiMethod: bridge.wapiMethod,
    });
  }

  private deriveRuntimePhase(
    probe: RuntimeBridgeProbeResult & { bridgeReady: boolean },
  ): InjectionPhase {
    if (this.health.phase === 'disposed') {
      return 'disposed';
    }

    if (this.health.degradedReasons.length > 0) {
      return 'degraded';
    }

    if (probe.bridgeReady) {
      return 'bridge_ready';
    }

    if (probe.sessionLoaded) {
      return 'session_ready';
    }

    if (probe.hasStoreMsg) {
      return 'store_detected';
    }

    if (probe.hasRuntime) {
      return 'runtime_detected';
    }

    return this.health.phase;
  }

  private async notifyNavigationObservers(frame: IFrame, generation: GenerationSnapshot): Promise<void> {
    const observers = [...this.navigationObservers.values()];
    await Promise.allSettled(observers.map((observer) => Promise.resolve(observer.handler(frame, generation))));
  }

  private isMainFrame(frame: IFrame | undefined): boolean {
    if (!frame) {
      return true;
    }

    try {
      return frame.isMainFrame();
    } catch {
      return true;
    }
  }

  private noteRegistrationFailure(scope: string, error: unknown, required: boolean, context?: RegistrationFailureContext): void {
    const normalized = error instanceof Error ? error : new Error(String(error));
    const degradedReasons = required
      ? [...this.health.degradedReasons, scope]
      : this.health.degradedReasons;

    this.health = {
      ...this.health,
      degradedReasons,
      phase: required ? 'degraded' : this.health.phase,
      lastError: {
        message: normalized.message,
        stack: normalized.stack,
        ts: Date.now(),
      },
    };

    this.logger.warn('injection_controller_registration_failed', {
      scope,
      required,
      error: normalized.message,
      errorStack: context?.installErrorStack ?? normalized.stack,
      phase: this.health.phase,
      generation: this.health.generation,
      pageUrl: this.page?.url?.(),
      bridgeId: context?.bridgeId,
      bindingName: context?.bindingName,
      wapiMethod: context?.wapiMethod,
      runtimeId: context?.runtimeId,
      installStatus: context?.installStatus,
      installError: context?.installError,
      runtimeAsset: context?.runtimeAsset,
    });
  }
}
