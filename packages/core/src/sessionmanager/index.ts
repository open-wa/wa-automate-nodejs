import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { OpenWAEventMap, STATE } from '../events/eventMap.js';

export type SessionValidationStage = 'post_injection' | 'post_patch' | 'post_overlay';

export interface SessionCapabilitySnapshot {
    hasRuntime: boolean;
    hasStoreMsg: boolean;
    sessionLoaded: boolean;
}

export interface SessionValidationSnapshot {
    stage: SessionValidationStage;
    attempt: number;
    usable: boolean;
    repairable: boolean;
    repaired: boolean;
    checkedAt: number;
    failureReason?: string;
    capability: SessionCapabilitySnapshot;
}

export interface SessionRepairSnapshot {
    stage: SessionValidationStage;
    attempt: number;
    reason: string;
    success: boolean;
    at: number;
}

export interface SessionFinalizationSnapshot {
    outcome: 'pending' | 'ready' | 'failed';
    updatedAt: number;
    detail?: string;
}

export type SessionReadinessRequirementName =
    | 'runtimeUsable'
    | 'patchLifecycle'
    | 'licenseLifecycle'
    | 'finalization';

export type SessionReadinessRequirementState = 'pending' | 'satisfied' | 'non_blocking' | 'failed';

export interface SessionReadinessRequirement {
    state: SessionReadinessRequirementState;
    updatedAt: number;
    detail?: string;
}

export type SessionLowerLevelObligationName =
    | 'driverActiveGeneration'
    | 'runtimeOperational'
    | 'runtimeBridgeReady'
    | 'reinjectionSettled';

export interface SessionLowerLevelGenerationSnapshot {
    browserContextId: string | null;
    documentId: string | null;
    runtimeId: string | null;
}

export interface SessionLowerLevelTruthSnapshot {
    generation: SessionLowerLevelGenerationSnapshot;
    phase?: string;
    driverActiveGeneration: boolean;
    runtimeOperational: boolean;
    runtimeBridgeReady: boolean;
    reinjectionSettled: boolean;
    missingRuntimeMethods: string[];
    pending: SessionLowerLevelObligationName[];
}

export interface SessionLowerLevelTruthInput {
    generation?: Partial<SessionLowerLevelGenerationSnapshot> | null;
    phase?: string;
    driverActiveGeneration?: boolean;
    runtimeOperational?: boolean;
    runtimeBridgeReady?: boolean;
    reinjectionSettled?: boolean;
    missingRuntimeMethods?: string[];
}

export interface SessionReadinessSnapshot {
    state: STATE;
    status: 'ready' | 'not_ready' | 'blocked';
    ready: boolean;
    exposureSafe: boolean;
    pending: Array<SessionReadinessRequirementName | SessionLowerLevelObligationName>;
    blockers: SessionReadinessRequirementName[];
    requirements: Record<SessionReadinessRequirementName, SessionReadinessRequirement>;
    lowerLevel: SessionLowerLevelTruthSnapshot;
    lastCapability: SessionCapabilitySnapshot | null;
    validations: SessionValidationSnapshot[];
    repairs: SessionRepairSnapshot[];
    finalization: SessionFinalizationSnapshot;
}

export interface SessionRuntimeSnapshot {
    lastCapability: SessionCapabilitySnapshot | null;
    validations: SessionValidationSnapshot[];
    repairs: SessionRepairSnapshot[];
    finalization: SessionFinalizationSnapshot;
    readiness: Record<SessionReadinessRequirementName, SessionReadinessRequirement>;
}

export interface SessionStore {
    get(sessionId: string): Promise<unknown>;
    set(sessionId: string, data: unknown): Promise<void>;
    delete(sessionId: string): Promise<void>;
}

export interface SessionManagerOptions {
    sessionId: string;
    events: HyperEmitter<OpenWAEventMap>;
    logger: Logger;
    store?: SessionStore;
}

export class SessionManager {
    private state: STATE = 'DISCONNECTED';
    private sessionId: string;
    private events: HyperEmitter<OpenWAEventMap>;
    private logger: Logger;
    private store?: SessionStore;
    private runtime: SessionRuntimeSnapshot = {
        lastCapability: null,
        validations: [],
        repairs: [],
        finalization: {
            outcome: 'pending',
            updatedAt: Date.now(),
        },
        readiness: this.createInitialReadiness(),
    };

    constructor(options: SessionManagerOptions) {
        this.sessionId = options.sessionId;
        this.events = options.events;
        this.logger = options.logger;
        this.store = options.store;
    }

    async setState(newState: STATE, reason?: string): Promise<void> {
        const prevState = this.state;
        this.state = newState;
        this.events.emit('session.state.changed', {
            correlationId: 'system',
            ts: Date.now(),
            step: 'state_change',
            details: { prev: prevState, next: newState, reason },
        });
        this.logger.debug('session_state_changed', {
            sessionId: this.sessionId,
            prevState,
            nextState: newState,
            reason,
        });
    }

    getState(): STATE {
        return this.state;
    }

    resetRuntime(): void {
        this.runtime = {
            lastCapability: null,
            validations: [],
            repairs: [],
            finalization: {
                outcome: 'pending',
                updatedAt: Date.now(),
            },
            readiness: this.createInitialReadiness(),
        };
    }

    recordValidation(snapshot: SessionValidationSnapshot): void {
        this.runtime.lastCapability = { ...snapshot.capability };
        this.runtime.validations = [...this.runtime.validations, snapshot];
    }

    recordRepair(snapshot: SessionRepairSnapshot): void {
        this.runtime.repairs = [...this.runtime.repairs, snapshot];
    }

    setFinalization(outcome: SessionFinalizationSnapshot['outcome'], detail?: string): void {
        this.runtime.finalization = {
            outcome,
            detail,
            updatedAt: Date.now(),
        };

        if (outcome === 'ready') {
            this.updateReadiness('finalization', 'satisfied', detail);
            return;
        }

        if (outcome === 'failed') {
            this.updateReadiness('finalization', 'failed', detail);
            return;
        }

        this.updateReadiness('finalization', 'pending', detail);
    }

    updateReadiness(
        requirement: SessionReadinessRequirementName,
        state: SessionReadinessRequirementState,
        detail?: string
    ): void {
        this.runtime.readiness = {
            ...this.runtime.readiness,
            [requirement]: {
                state,
                detail,
                updatedAt: Date.now(),
            },
        };
    }

    getRuntimeSnapshot(): SessionRuntimeSnapshot {
        return {
            lastCapability: this.runtime.lastCapability ? { ...this.runtime.lastCapability } : null,
            validations: this.runtime.validations.map((validation) => ({
                ...validation,
                capability: { ...validation.capability },
            })),
            repairs: this.runtime.repairs.map((repair) => ({ ...repair })),
            finalization: { ...this.runtime.finalization },
            readiness: this.cloneReadiness(),
        };
    }

    getReadinessSnapshot(lowerLevelTruth?: SessionLowerLevelTruthInput): SessionReadinessSnapshot {
        const requirements = this.cloneReadiness();
        const requirementPending = (Object.entries(requirements) as Array<[SessionReadinessRequirementName, SessionReadinessRequirement]>)
            .filter(([, requirement]) => requirement.state === 'pending')
            .map(([name]) => name);
        const blockers = (Object.entries(requirements) as Array<[SessionReadinessRequirementName, SessionReadinessRequirement]>)
            .filter(([, requirement]) => requirement.state === 'failed')
            .map(([name]) => name);
        const lowerLevel = this.createLowerLevelTruthSnapshot(lowerLevelTruth);
        const pending = [...requirementPending, ...lowerLevel.pending];
        const exposureSafe = blockers.length === 0
            && pending.length === 0
            && this.runtime.finalization.outcome === 'ready';
        const ready = this.state === 'READY' && exposureSafe;

        return {
            state: this.state,
            status: ready ? 'ready' : blockers.length > 0 ? 'blocked' : 'not_ready',
            ready,
            exposureSafe,
            pending,
            blockers,
            requirements,
            lowerLevel,
            lastCapability: this.runtime.lastCapability ? { ...this.runtime.lastCapability } : null,
            validations: this.runtime.validations.map((validation) => ({
                ...validation,
                capability: { ...validation.capability },
            })),
            repairs: this.runtime.repairs.map((repair) => ({ ...repair })),
            finalization: { ...this.runtime.finalization },
        };
    }

    private createInitialReadiness(): Record<SessionReadinessRequirementName, SessionReadinessRequirement> {
        const updatedAt = Date.now();
        return {
            runtimeUsable: {
                state: 'pending',
                updatedAt,
                detail: 'Runtime injection has not yet proven usable capability',
            },
            patchLifecycle: {
                state: 'pending',
                updatedAt,
                detail: 'Patch lifecycle has not yet completed',
            },
            licenseLifecycle: {
                state: 'pending',
                updatedAt,
                detail: 'License lifecycle has not yet completed',
            },
            finalization: {
                state: 'pending',
                updatedAt,
                detail: 'Session finalization has not yet completed',
            },
        };
    }

    private cloneReadiness(): Record<SessionReadinessRequirementName, SessionReadinessRequirement> {
        return {
            runtimeUsable: { ...this.runtime.readiness.runtimeUsable },
            patchLifecycle: { ...this.runtime.readiness.patchLifecycle },
            licenseLifecycle: { ...this.runtime.readiness.licenseLifecycle },
            finalization: { ...this.runtime.readiness.finalization },
        };
    }

    private createLowerLevelTruthSnapshot(lowerLevelTruth?: SessionLowerLevelTruthInput): SessionLowerLevelTruthSnapshot {
        const generation = lowerLevelTruth?.generation;
        const snapshot: SessionLowerLevelTruthSnapshot = {
            generation: {
                browserContextId: generation?.browserContextId ?? null,
                documentId: generation?.documentId ?? null,
                runtimeId: generation?.runtimeId ?? null,
            },
            phase: lowerLevelTruth?.phase,
            driverActiveGeneration: lowerLevelTruth?.driverActiveGeneration ?? false,
            runtimeOperational: lowerLevelTruth?.runtimeOperational ?? false,
            runtimeBridgeReady: lowerLevelTruth?.runtimeBridgeReady ?? false,
            reinjectionSettled: lowerLevelTruth?.reinjectionSettled ?? false,
            missingRuntimeMethods: [...(lowerLevelTruth?.missingRuntimeMethods ?? [])],
            pending: [],
        };

        if (!snapshot.driverActiveGeneration) {
            snapshot.pending.push('driverActiveGeneration');
        }

        if (!snapshot.runtimeOperational) {
            snapshot.pending.push('runtimeOperational');
        }

        if (!snapshot.runtimeBridgeReady) {
            snapshot.pending.push('runtimeBridgeReady');
        }

        if (!snapshot.reinjectionSettled) {
            snapshot.pending.push('reinjectionSettled');
        }

        return snapshot;
    }
}
