import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { z } from 'zod';

export interface EventContext {
  correlationId: string;
  attempt?: number;
  ts: number;
}

export interface StepEvent<TDetails = Record<string, unknown>> extends EventContext {
  step: string;
  details?: TDetails;
  error?: { name: string; message: string; stack?: string };
  durationMs?: number;
}

export interface OpenWAEventMeta {
  internal: boolean;
  sensitive: boolean;
}

export type Message = unknown;
export type Ack = unknown;
export type Chat = unknown;
export type ChatState = unknown;
export type GroupParticipantChange = unknown;
export type BatteryStatus = unknown;
export type IncomingCall = unknown;
export type CallState = unknown;
export type PollVote = unknown;
export type Reaction = unknown;
export type MessagePreProcessor = unknown;
export type MediaProcessResult = unknown;
export type WebhookRegistration = unknown;
export type WebhookDeliveryAttempt = unknown;
export type WebhookDeliveryResult = unknown;
export type PersistenceArtifact = unknown;

export type STATE = 'STARTING' | 'AUTHENTICATING' | 'READY' | 'DISCONNECTED' | 'STOPPED';

export interface OpenWAEventMap {
  'launch.create.start': StepEvent<{ configSummary?: Record<string, unknown> }>;
  'launch.create.retry': StepEvent<{ reason: string; nextAttempt: number }>;
  'launch.create.ready': StepEvent<{ state: STATE }>;
  
  'launch.config.setup.before': StepEvent;
  'launch.config.setup.after': StepEvent;
  'launch.logging.setup.before': StepEvent;
  'launch.logging.setup.after': StepEvent;
  
  'launch.update.check.before': StepEvent<{ currentVersion?: string }>;
  'launch.update.check.after': StepEvent<{ updateAvailable?: boolean; latestVersion?: string }>;
  
  'launch.browser.init.before': StepEvent<{ browserArgs?: string[]; headless?: boolean }>;
  'launch.browser.init.after': StepEvent<{ pid?: number }>;
  
  'launch.page.init.before': StepEvent;
  'launch.page.init.after': StepEvent<{ userAgent?: string; viewport?: { w: number; h: number } }>;
  'launch.page.interception.before': StepEvent<{ enabled: boolean }>;
  'launch.page.interception.after': StepEvent;
  
  'launch.navigation.gotoWaWeb.before': StepEvent<{ url: string }>;
  'launch.navigation.gotoWaWeb.after': StepEvent<{ finalUrl?: string }>;
  
  'launch.modules.wait.before': StepEvent<{ timeoutMs?: number }>;
  'launch.modules.wait.after': StepEvent<{ success: boolean }>;
  
  'launch.injection.earlyCheck.before': StepEvent;
  'launch.injection.earlyCheck.after': StepEvent<{ canInjectPreAuth: boolean }>;
  
  'launch.auth.check.before': StepEvent<{ timeoutMs?: number }>;
  'launch.auth.check.after': StepEvent<{ isAuthenticated: boolean; method?: 'race' | 'direct' | 'shell_probe' }>;
  'launch.auth.nuke.detected': StepEvent<{ reason: string }>;
  'launch.auth.timeout': StepEvent<{ timeoutMs: number; phoneOutOfReach?: boolean }>;
  'launch.auth.phoneOutOfReach': StepEvent<{ reason?: string }>;
  
  'launch.auth.qr.requested': StepEvent<{ smartQr?: boolean }>;
  'launch.auth.qr.generated': StepEvent<{ qr: string; ascii?: string; attemptInThisCycle?: number }>;
  'launch.auth.qr.scanned': StepEvent;
  'launch.auth.qr.expired': StepEvent;
  'launch.auth.linkCode.requested': StepEvent;
  'launch.auth.linkCode.generated': StepEvent<{ linkCode: string }>;
  
  'launch.auth.pairing': StepEvent;
  'launch.auth.syncing': StepEvent;
  
  'launch.license.preload.before': StepEvent<{ source?: 'local' | 'remote' | 'cached' }>;
  'launch.license.preload.after': StepEvent<{
    success: boolean;
    status?: 'valid' | 'metadata_only' | 'missing' | 'invalid' | 'expired';
    source?: 'local' | 'remote' | 'cached' | 'none';
    payloadSource?: 'server' | 'local_metadata';
    detail?: string;
    blockingFailure?: boolean;
  }>;
  
  'launch.wapi.inject.before': StepEvent<{ injectPreApiScripts: boolean }>;
  'launch.wapi.inject.after': StepEvent<{ success: boolean }>;
  'launch.helper.pre_api.before': StepEvent<{ mode: 'noop' | 'scripts' }>;
  'launch.helper.pre_api.after': StepEvent<{ mode: 'noop' | 'scripts'; success: boolean; requiredLegacyHelpers?: readonly string[] }>;
  
  'launch.session.validityCheck.before': StepEvent<{ phase: 'post_injection' | 'post_patch' | 'post_overlay' }>;
  'launch.session.validityCheck.after': StepEvent<{
    phase: 'post_injection' | 'post_patch' | 'post_overlay';
    valid: boolean;
    usable: boolean;
    hasRuntime: boolean;
    hasStore: boolean;
    hasMsg: boolean;
    sessionLoaded: boolean;
    repairable: boolean;
    repaired?: boolean;
    bridgeReady?: boolean;
    requiredMethods?: string[];
    missingMethods?: string[];
    failureReason?: 'runtime_missing' | 'store_missing' | 'session_not_loaded' | 'required_method_missing';
  }>;
  'launch.session.invalid.retry': StepEvent<{ reason: string }>;
  
  'launch.license.check.before': StepEvent<{ source?: 'local' | 'remote' | 'cached' }>;
  'launch.license.check.after': StepEvent<{
    status: 'valid' | 'metadata_only' | 'missing' | 'invalid' | 'expired';
    detail?: string;
    source?: 'local' | 'remote' | 'cached';
    payloadSource?: 'server' | 'local_metadata';
    blockingFailure?: boolean;
  }>;
  
  'launch.patch.init.before': StepEvent<{ phase?: 'preload'; source?: 'builtin' | 'remote' | 'cached' | 'none' }>;
  'launch.patch.init.after': StepEvent<{
    phase?: 'preload';
    applied: string[];
    available?: string[];
    outcome?: 'ready' | 'none' | 'failed';
    source?: 'builtin' | 'remote' | 'cached' | 'none';
    tag?: string | null;
    blockingFailure?: boolean;
  }>;
  'launch.patch.integrity.before': StepEvent<{ phase: 'post_patch' }>;
  'launch.patch.integrity.after': StepEvent<{
    phase: 'post_patch';
    valid: boolean;
    usable: boolean;
    failureReason?: 'runtime_missing' | 'store_missing' | 'session_not_loaded' | 'required_method_missing';
  }>;
  
  'launch.client.finalize.before': StepEvent<{ validationStage: 'loaded_equivalent'; patchOutcome: string; licenseStatus: string }>;
  'launch.client.finalize.after': StepEvent<{
    state: STATE;
    success: boolean;
    outcome: 'ready' | 'failed';
    detail?: string;
  }>;

  'internal_launch_progress': { value?: number; text?: string };
  'critical_internal_message': { value?: string; text?: string };

  'session.state.changed': StepEvent<{ prev: STATE; next: STATE; reason?: string }>;
  'session.connection.disconnected': StepEvent<{ reason?: string; wasLoggedIn?: boolean }>;
  'session.connection.reconnecting': StepEvent<{ reason?: string }>;
  'session.connection.reconnected': StepEvent<{ downtimeMs?: number }>;
  
  'session.frame.navigated': StepEvent<{ url?: string; isMainFrame: boolean }>;
  'session.reinject.detected': StepEvent<{ reason: 'wapi_missing' | 'stale_session' | 'reload' | string }>;
  'session.reinject.before': StepEvent<{ reason: string }>;
  'session.reinject.after': StepEvent<{ success: boolean }>;
  'session.reinject.qr.waiting': StepEvent<{ reason?: string }>;
  
  'session.stale.detected': StepEvent<{ reason?: string }>;
  'session.logout': StepEvent<{ reason?: string }>;

  'message.received': { ctx: EventContext; message: Message };
  'message.any': { ctx: EventContext; message: Message };
  'message.deleted': { ctx: EventContext; messageId: string; chatId: string; by?: string };

  'ack.changed': { ctx: EventContext; ack: Ack };

  'group.addedToGroup': { ctx: EventContext; groupId: string; by?: string };
  'group.removedFromGroup': { ctx: EventContext; groupId: string; by?: string };
  'group.participants.changed.global': { ctx: EventContext; change: GroupParticipantChange };
  'group.approval.request': { ctx: EventContext; groupId: string; requesterId: string };
  'group.changed': { ctx: EventContext; groupId: string; changeType: string };

  'chat.deleted': { ctx: EventContext; chatId: string };
  'chat.opened': { ctx: EventContext; chat: Chat };
  'chat.state': { ctx: EventContext; state: ChatState };

  'device.battery': { ctx: EventContext; battery: BatteryStatus };
  'device.plugged': { ctx: EventContext; plugged: boolean; battery?: number };

  'call.incoming': { ctx: EventContext; call: IncomingCall };
  'call.state': { ctx: EventContext; state: CallState };

  'auth.logout': { ctx: EventContext; reason?: string };

  'ui.button': { ctx: EventContext; messageId: string; buttonId: string; from: string };
  'ui.poll.vote': { ctx: EventContext; vote: PollVote };

  'broadcast.received': { ctx: EventContext; message: Message };
  'label.changed': { ctx: EventContext; labelId: string; action: 'added' | 'removed' | 'renamed' };
  'story.received': { ctx: EventContext; storyId: string; from: string; timestamp: number };
  'commerce.order': { ctx: EventContext; orderId: string; from: string };
  'commerce.product.new': { ctx: EventContext; productId: string; catalogId?: string };
  'reaction.added': { ctx: EventContext; reaction: Reaction };

  'media.preprocess.before': { ctx: EventContext; message: Message; processors: MessagePreProcessor[] };
  'media.preprocess.after': { ctx: EventContext; message: Message; results: MediaProcessResult[] };

  'webhook.registered': { ctx: EventContext; webhook: WebhookRegistration };
  'webhook.unregistered': { ctx: EventContext; webhookId: string };
  'webhook.trigger.before': { ctx: EventContext; webhookId: string; event: string; payload: unknown };
  'webhook.trigger.after': { ctx: EventContext; webhookId: string; event: string; enqueued: boolean; reasonIfSkipped?: string };
  'webhook.queue.enqueued': { ctx: EventContext; delivery: WebhookDeliveryAttempt };
  'webhook.queue.dequeued': { ctx: EventContext; deliveryId: string; webhookId: string };
  'webhook.deliver.before': { ctx: EventContext; attempt: WebhookDeliveryAttempt };
  'webhook.deliver.after': { ctx: EventContext; result: WebhookDeliveryResult };

  'persistence.session.save.before': StepEvent<{ target: 'disk' | 's3' | 'memory' }>;
  'persistence.session.save.after': StepEvent<{ artifacts: PersistenceArtifact[] }>;
  'persistence.compress.zstd.before': StepEvent<{ inputBytes?: number }>;
  'persistence.compress.zstd.after': StepEvent<{ artifact: PersistenceArtifact }>;
  'persistence.archive.zip.before': StepEvent<{ inputs: Array<{ path: string; sizeBytes?: number }> }>;
  'persistence.archive.zip.after': StepEvent<{ artifact: PersistenceArtifact }>;
  'persistence.upload.s3.before': StepEvent<{ bucket: string; key: string; kind: 'sessionData' | 'zstd' | 'zip' }>;
  'persistence.upload.s3.after': StepEvent<{ bucket: string; key: string; etag?: string; sizeBytes?: number }>;

  'patch.apply.before': StepEvent<{ patchId: string; description?: string; required?: boolean; source?: 'builtin' | 'remote' | 'cached' }>;
  'patch.apply.after': StepEvent<{
    patchId: string;
    applied: boolean;
    outcome?: 'applied' | 'not_applicable' | 'failed';
    required?: boolean;
    detail?: string;
  }>;
  'patch.init.before': StepEvent<{ phase?: 'apply'; patchIds?: string[]; preloadOutcome?: 'ready' | 'none' | 'failed' }>;
  'patch.init.after': StepEvent<{
    phase?: 'apply';
    applied: string[];
    outcome?: 'applied' | 'skipped' | 'failed';
    blockingFailure?: boolean;
    results?: Array<{
      patchId: string;
      description?: string;
      required: boolean;
      outcome: 'applied' | 'not_applicable' | 'failed';
      detail?: string;
    }>;
  }>;

  'license.check.before': StepEvent<{ source: 'local' | 'remote' | 'cached' }>;
  'license.check.after': StepEvent<{
    status: 'valid' | 'metadata_only' | 'missing' | 'invalid' | 'expired';
    detail?: string;
    source?: 'local' | 'remote' | 'cached';
    payloadSource?: 'server' | 'local_metadata';
    blockingFailure?: boolean;
  }>;
  'license.inject.before': StepEvent;
  'license.inject.after': StepEvent<{
    success: boolean;
    status?: 'valid' | 'metadata_only' | 'missing' | 'invalid' | 'expired';
    keyType?: string;
    payloadSource?: 'server' | 'local_metadata';
    detail?: string;
  }>;

  'cli.launched': { ctx: EventContext; argv: string[]; version?: string };
  'server.start.before': StepEvent<{ host?: string; port?: number }>;
  'server.start.after': StepEvent<{ host: string; port: number }>;
  'server.port.live': { ctx: EventContext; url: string; host: string; port: number };

  'error': { scope: string; error: Error; fatal?: boolean };
  
  'core.starting': { config: unknown };
  'core.started': Record<string, never>;
  'core.stopping': { reason?: string };
  'core.stopped': Record<string, never>;
  
  'client.ready': { sessionId: string };
}

export const OpenWAEventMetaMap: Record<keyof OpenWAEventMap, OpenWAEventMeta> = {
  'launch.create.start': { internal: true, sensitive: false },
  'launch.create.retry': { internal: true, sensitive: false },
  'launch.create.ready': { internal: true, sensitive: false },
  'launch.config.setup.before': { internal: true, sensitive: false },
  'launch.config.setup.after': { internal: true, sensitive: false },
  'launch.logging.setup.before': { internal: true, sensitive: false },
  'launch.logging.setup.after': { internal: true, sensitive: false },
  'launch.update.check.before': { internal: true, sensitive: false },
  'launch.update.check.after': { internal: true, sensitive: false },
  'launch.browser.init.before': { internal: true, sensitive: false },
  'launch.browser.init.after': { internal: true, sensitive: false },
  'launch.page.init.before': { internal: true, sensitive: false },
  'launch.page.init.after': { internal: true, sensitive: false },
  'launch.page.interception.before': { internal: true, sensitive: false },
  'launch.page.interception.after': { internal: true, sensitive: false },
  'launch.navigation.gotoWaWeb.before': { internal: true, sensitive: false },
  'launch.navigation.gotoWaWeb.after': { internal: true, sensitive: false },
  'launch.modules.wait.before': { internal: true, sensitive: false },
  'launch.modules.wait.after': { internal: true, sensitive: false },
  'launch.injection.earlyCheck.before': { internal: true, sensitive: false },
  'launch.injection.earlyCheck.after': { internal: true, sensitive: false },
  'launch.auth.check.before': { internal: true, sensitive: false },
  'launch.auth.check.after': { internal: true, sensitive: false },
  'launch.auth.nuke.detected': { internal: true, sensitive: false },
  'launch.auth.timeout': { internal: true, sensitive: false },
  'launch.auth.phoneOutOfReach': { internal: true, sensitive: false },
  'launch.auth.qr.requested': { internal: true, sensitive: false },
  'launch.auth.qr.generated': { internal: true, sensitive: true },
  'launch.auth.qr.scanned': { internal: true, sensitive: false },
  'launch.auth.qr.expired': { internal: true, sensitive: false },
  'launch.auth.linkCode.requested': { internal: true, sensitive: false },
  'launch.auth.linkCode.generated': { internal: true, sensitive: true },
  'launch.auth.pairing': { internal: true, sensitive: false },
  'launch.auth.syncing': { internal: true, sensitive: false },
  'launch.license.preload.before': { internal: true, sensitive: false },
  'launch.license.preload.after': { internal: true, sensitive: false },
  'launch.wapi.inject.before': { internal: true, sensitive: false },
  'launch.wapi.inject.after': { internal: true, sensitive: false },
  'launch.helper.pre_api.before': { internal: true, sensitive: false },
  'launch.helper.pre_api.after': { internal: true, sensitive: false },
  'launch.session.validityCheck.before': { internal: true, sensitive: false },
  'launch.session.validityCheck.after': { internal: true, sensitive: false },
  'launch.session.invalid.retry': { internal: true, sensitive: false },
  'launch.license.check.before': { internal: true, sensitive: false },
  'launch.license.check.after': { internal: true, sensitive: false },
  'launch.patch.init.before': { internal: true, sensitive: false },
  'launch.patch.init.after': { internal: true, sensitive: false },
  'launch.patch.integrity.before': { internal: true, sensitive: false },
  'launch.patch.integrity.after': { internal: true, sensitive: false },
  'launch.client.finalize.before': { internal: true, sensitive: false },
  'launch.client.finalize.after': { internal: true, sensitive: false },

  'internal_launch_progress': { internal: true, sensitive: false },
  'critical_internal_message': { internal: true, sensitive: false },

  'session.state.changed': { internal: false, sensitive: false },
  'session.connection.disconnected': { internal: false, sensitive: false },
  'session.connection.reconnecting': { internal: false, sensitive: false },
  'session.connection.reconnected': { internal: false, sensitive: false },
  'session.frame.navigated': { internal: true, sensitive: false },
  'session.reinject.detected': { internal: true, sensitive: false },
  'session.reinject.before': { internal: true, sensitive: false },
  'session.reinject.after': { internal: true, sensitive: false },
  'session.reinject.qr.waiting': { internal: true, sensitive: false },
  'session.stale.detected': { internal: true, sensitive: false },
  'session.logout': { internal: false, sensitive: false },

  'message.received': { internal: false, sensitive: false },
  'message.any': { internal: false, sensitive: false },
  'message.deleted': { internal: false, sensitive: false },
  'ack.changed': { internal: false, sensitive: false },
  'group.addedToGroup': { internal: false, sensitive: false },
  'group.removedFromGroup': { internal: false, sensitive: false },
  'group.participants.changed.global': { internal: false, sensitive: false },
  'group.approval.request': { internal: false, sensitive: false },
  'group.changed': { internal: false, sensitive: false },
  'chat.deleted': { internal: false, sensitive: false },
  'chat.opened': { internal: false, sensitive: false },
  'chat.state': { internal: false, sensitive: false },
  'device.battery': { internal: false, sensitive: false },
  'device.plugged': { internal: false, sensitive: false },
  'call.incoming': { internal: false, sensitive: false },
  'call.state': { internal: false, sensitive: false },
  'auth.logout': { internal: false, sensitive: false },
  'ui.button': { internal: false, sensitive: false },
  'ui.poll.vote': { internal: false, sensitive: false },
  'broadcast.received': { internal: false, sensitive: false },
  'label.changed': { internal: false, sensitive: false },
  'story.received': { internal: false, sensitive: false },
  'commerce.order': { internal: false, sensitive: false },
  'commerce.product.new': { internal: false, sensitive: false },
  'reaction.added': { internal: false, sensitive: false },

  'media.preprocess.before': { internal: true, sensitive: false },
  'media.preprocess.after': { internal: true, sensitive: false },

  'webhook.registered': { internal: true, sensitive: false },
  'webhook.unregistered': { internal: true, sensitive: false },
  'webhook.trigger.before': { internal: true, sensitive: false },
  'webhook.trigger.after': { internal: true, sensitive: false },
  'webhook.queue.enqueued': { internal: true, sensitive: false },
  'webhook.queue.dequeued': { internal: true, sensitive: false },
  'webhook.deliver.before': { internal: true, sensitive: false },
  'webhook.deliver.after': { internal: true, sensitive: false },

  'persistence.session.save.before': { internal: true, sensitive: true },
  'persistence.session.save.after': { internal: true, sensitive: true },
  'persistence.compress.zstd.before': { internal: true, sensitive: true },
  'persistence.compress.zstd.after': { internal: true, sensitive: true },
  'persistence.archive.zip.before': { internal: true, sensitive: true },
  'persistence.archive.zip.after': { internal: true, sensitive: true },
  'persistence.upload.s3.before': { internal: true, sensitive: true },
  'persistence.upload.s3.after': { internal: true, sensitive: true },

  'patch.apply.before': { internal: true, sensitive: false },
  'patch.apply.after': { internal: true, sensitive: false },
  'patch.init.before': { internal: true, sensitive: false },
  'patch.init.after': { internal: true, sensitive: false },
  'license.check.before': { internal: true, sensitive: false },
  'license.check.after': { internal: true, sensitive: false },
  'license.inject.before': { internal: true, sensitive: false },
  'license.inject.after': { internal: true, sensitive: false },

  'cli.launched': { internal: true, sensitive: false },
  'server.start.before': { internal: true, sensitive: false },
  'server.start.after': { internal: true, sensitive: false },
  'server.port.live': { internal: true, sensitive: false },

  'error': { internal: false, sensitive: false },
  
  'core.starting': { internal: false, sensitive: false },
  'core.started': { internal: false, sensitive: false },
  'core.stopping': { internal: false, sensitive: false },
  'core.stopped': { internal: false, sensitive: false },
  'client.ready': { internal: false, sensitive: false },
};

export function isWebhookEligible(event: keyof OpenWAEventMap): boolean {
  const meta = OpenWAEventMetaMap[event];
  return !meta.internal && !meta.sensitive;
}

export function isLoggingEligible(event: keyof OpenWAEventMap): boolean {
  const meta = OpenWAEventMetaMap[event];
  return !meta.sensitive;
}
