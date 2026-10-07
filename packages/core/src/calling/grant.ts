import { Schema } from 'effect';
import { CallingGrantSchema, type CallingGrant } from '@open-wa/schema';

const bytes = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));

/** Trust keys are configured at composition, never taken from the issuer response. */
export async function verifyCallingGrant(
  token: string,
  keys: Readonly<Record<string, string>>,
  binding: { sessionId: string; account: string },
): Promise<CallingGrant | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2 || token.length > 16_384) return null;
    const grant = Schema.decodeUnknownSync(CallingGrantSchema)(JSON.parse(new TextDecoder().decode(bytes(parts[0]))));
    const key = keys[grant.keyId];
    const now = Date.now();
    if (!key || grant.sessionId !== binding.sessionId || grant.account !== binding.account || grant.issuedAt > now + 30_000 || grant.expiresAt <= now || grant.expiresAt <= grant.issuedAt) return null;
    const imported = await crypto.subtle.importKey('raw', bytes(key), 'Ed25519', false, ['verify']);
    return await crypto.subtle.verify('Ed25519', imported, bytes(parts[1]), new TextEncoder().encode(parts[0])) ? grant : null;
  } catch { return null; }
}
