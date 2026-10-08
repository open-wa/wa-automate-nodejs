import type { SessionRefreshSnapshot } from '@open-wa/socket-client';

const labels = {
  idle: '', preparing: 'Downloading patches and checking license access…', draining: 'Finishing current session operations…',
  checkpointing: 'Saving session state…', reloading: 'Reloading WhatsApp…', installing: 'Restoring session functionality…',
  restoring: 'Restoring the previous installation…', needs_auth: 'Pair the session using its QR code to continue.',
  ready: 'Patches refreshed. The session is ready.', failed: 'Refresh could not complete.',
};
export function SessionRefreshProgress({ snapshot, error }: { snapshot: SessionRefreshSnapshot | null; error?: string | null }) {
  if (!error && (!snapshot || snapshot.phase === 'idle')) return null;
  const text = error || (snapshot?.restored ? 'Refresh failed; the previous functionality was restored.'
    : snapshot?.running ? labels[snapshot.phase] : snapshot?.error?.message || (snapshot ? labels[snapshot.phase] : ''));
  return <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{text}</p>;
}
