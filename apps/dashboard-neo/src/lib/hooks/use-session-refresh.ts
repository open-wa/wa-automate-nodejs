import { useCallback, useEffect, useState } from 'react';
import type { SessionRefreshOptions, SessionRefreshSnapshot } from '@open-wa/socket-client';
import { getApiKey, getApiUrl, getClient } from '@/lib/api-client';
import { useDemo } from '@/lib/demo/use-demo';
import { useSocket } from './use-socket';

export function useSessionRefresh() {
  const { isDemo } = useDemo();
  const { connected } = useSocket();
  const [snapshot, setSnapshot] = useState<SessionRefreshSnapshot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useCallback(async (method: 'GET' | 'POST', options?: SessionRefreshOptions) => {
    const base = getApiUrl();
    const apiKey = getApiKey(base);
    const url = new URL(base, window.location.origin);
    url.search = ''; url.hash = '';
    url.pathname = `${url.pathname.replace(/\/$/, '')}/api/session/refresh`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-API-Key'] = apiKey;
    const response = await fetch(url, { method, headers,
      ...(method === 'POST' ? { body: JSON.stringify(options ?? {}) } : {}), cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Session controls are unavailable.');
    return body;
  }, []);
  useEffect(() => {
    if (isDemo || !connected) { setSnapshot(null); return; }
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let detach: (() => void) | undefined;
    const read = async () => {
      let running = false;
      try {
        const next: SessionRefreshSnapshot = await request('GET');
        if (disposed) return;
        running = next.running; setSnapshot(next);
      } catch { /* SSE and later polls reconcile an accepted operation after reconnect. */ }
      if (!disposed) timer = setTimeout(read, running ? 5000 : 15_000);
    };
    void read();
    void getClient().then(client => {
      if (disposed) return;
      const progress = (event: { refresh?: SessionRefreshSnapshot }) => {
        if (!disposed && event.refresh) setSnapshot(event.refresh);
      };
      client.socket.on('session.refresh.progress', progress);
      detach = () => client.socket.off('session.refresh.progress', progress);
    }).catch(() => undefined);
    return () => { disposed = true; clearTimeout(timer); detach?.(); };
  }, [isDemo, connected, request]);
  const startRefresh = useCallback(async (options: SessionRefreshOptions = {}) => {
    if (isDemo || !connected || submitting || snapshot?.running) return false;
    setSubmitting(true); setError(null);
    try {
      const accepted: { operationId: string } = await request('POST', options);
      setSnapshot({ operationId: accepted.operationId, reason: options.licenseKey === undefined ? 'manual_refresh' : 'license_activation',
        phase: 'preparing', running: true, startedAt: Date.now(), finishedAt: null, patchTag: snapshot?.patchTag ?? null,
        runtimeUsable: true, restored: false, error: null });
      // Acceptance survives failure of this immediate status read.
      void request('GET').then(setSnapshot).catch(() => undefined);
      return true;
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Refresh could not be requested.'); return false; }
    finally { setSubmitting(false); }
  }, [isDemo, connected, submitting, snapshot, request]);
  return { snapshot, submitting, error, startRefresh, available: connected && !isDemo, busy: submitting || snapshot?.running === true };
}
