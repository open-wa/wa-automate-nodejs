export interface SessionRefreshOptions { licenseKey?: string }
export type SessionRefreshPhase = 'idle' | 'preparing' | 'reloading' | 'installing' | 'restoring' | 'needs_auth' | 'ready' | 'failed';
export interface SessionRefreshSnapshot {
  operationId: string | null;
  reason: 'manual_refresh' | 'license_activation';
  phase: SessionRefreshPhase;
  running: boolean;
  startedAt: number | null;
  finishedAt: number | null;
  patchTag: string | null;
  runtimeUsable: boolean;
  restored: boolean;
  error: { code: string; message: string } | null;
}
export type SessionRefreshResult = SessionRefreshSnapshot;
