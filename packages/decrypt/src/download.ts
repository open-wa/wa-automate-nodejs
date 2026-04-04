/**
 * Download encrypted media from WhatsApp CDN using native fetch.
 *
 * Replaces the legacy axios-based downloader.
 */
import {
  DEFAULT_USER_AGENT,
} from './constants.js';

function buildUserAgent(override?: string): string {
  let ua = override ?? DEFAULT_USER_AGENT;
  if (!ua.includes('WhatsApp')) ua = `WhatsApp/2.16.352 ${ua}`;
  return ua;
}

/**
 * Download an encrypted media blob from the given URL.
 * Uses the global `fetch` API (Bun native / Node 18+).
 */
export async function downloadEncryptedMedia(
  url: string,
  options?: { useragent?: string; maxRetries?: number; retryDelay?: number },
): Promise<Uint8Array> {
  const { useragent, maxRetries = 3, retryDelay = 2_000 } = options ?? {};

  const headers: Record<string, string> = {
    'User-Agent': buildUserAgent(useragent),
    DNT: '1',
    'Upgrade-Insecure-Requests': '1',
    Origin: 'https://web.whatsapp.com/',
    Referer: 'https://web.whatsapp.com/',
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, { headers });

    if (res.ok) {
      return new Uint8Array(await res.arrayBuffer());
    }

    if (res.status === 404) {
      throw new Error(
        'This media does not exist or is no longer available on the server. ' +
          'See: https://docs.openwa.dev/pages/How%20to/decrypt-media.html#40439d',
      );
    }

    // Retry on transient errors
    if (attempt < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, retryDelay));
    }
  }

  throw new Error(`Failed to download media after ${maxRetries} attempts`);
}
