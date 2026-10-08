import { useEffect, useState } from 'react';
import type { LicenseFeatures } from '@open-wa/socket-client';
import { getClient } from '@/lib/api-client';
import { useDemo } from '@/lib/demo/use-demo';
import { useSocket } from './use-socket';

export type LicenseTier = 'insiders' | 'restricted';
export type LicenseState = 'loading' | 'licensed' | 'unlicensed' | 'unknown' | 'unavailable';
export type LicenseSnapshot = {
  state: LicenseState;
  tier: LicenseTier | null;
  keyType: string | null;
  features: Readonly<Record<string, boolean>>;
  detail: string | null;
  verifiedAt: number | null;
  source: 'runtime' | 'demo' | null;
};
const initial: LicenseSnapshot = { state: 'loading', tier: null, keyType: null, features: {}, detail: null, verifiedAt: null, source: null };
const demo: LicenseSnapshot = { ...initial, state: 'licensed', tier: 'insiders', keyType: 'Insiders Program', features: { patch_calls_control: false, patch_calls_audio: false, patch_calls_video: false }, source: 'demo', detail: 'Demo data only; this tier is not verified by a runtime session.' };
function readTier(value: string | null): LicenseTier | null {
  const normalized = value?.trim().toLowerCase().replace(/[ _-]+/g, ' ');
  if (normalized === 'insiders' || normalized === 'insiders program') return 'insiders';
  if (normalized === 'restricted' || normalized === 'b2b restricted volume license') return 'restricted';
  return null;
}
export function useLicense(): LicenseSnapshot {
  const { isDemo } = useDemo();
  const { connected } = useSocket();
  const [snapshot, setSnapshot] = useState<LicenseSnapshot>(isDemo ? demo : initial);
  useEffect(() => {
    if (isDemo) { setSnapshot(demo); return; }
    if (!connected) { setSnapshot({ ...initial, state: 'unavailable', detail: 'Connect a runtime session to read its licence access.' }); return; }
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        const client = await getClient();
        const result: LicenseFeatures = await client.getLicenseFeatures();
        if (!mounted) return;
        const state: LicenseState = result.status === 'valid' ? 'licensed' : result.status === 'missing' ? 'unlicensed' : result.status === 'metadata_only' ? 'unknown' : 'unavailable';
        setSnapshot({ state, tier: readTier(result.keyType), keyType: result.keyType, features: result.features, verifiedAt: Date.now(), source: 'runtime',
          detail: result.status === 'valid' ? 'Access selected by the licence server and applied to this session.' : result.status === 'missing' ? 'No licence is applied to this session.' : result.status === 'metadata_only' ? 'The session has licence metadata, but no server-confirmed access.' : `The session licence is ${result.status}.` });
        const untilExpiry = result.expiresAt === null ? Infinity : result.expiresAt - Date.now();
        timer = setTimeout(refresh, Math.min(30_000, untilExpiry > 0 ? untilExpiry + 50 : 30_000));
      } catch (reason) {
        if (!mounted) return;
        setSnapshot({ ...initial, state: 'unavailable', detail: reason instanceof Error ? reason.message : 'Licence access could not be read.' });
        timer = setTimeout(refresh, 30_000);
      }
    };
    void refresh();
    return () => { mounted = false; clearTimeout(timer); };
  }, [isDemo, connected]);
  return snapshot;
}
