import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { isIP } from 'node:net';
import ipaddr from 'ipaddr.js';
import type { CallbackFailure } from './protocol';

export function callbackUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new Error('Callbacks require public HTTPS URLs without credentials or fragments');
  }
  return url;
}

function publicAddress(value: string): boolean {
  if (!ipaddr.isValid(value)) return false;
  let address = ipaddr.parse(value);
  if (address.kind() === 'ipv6' && (address as ipaddr.IPv6).isIPv4MappedAddress()) address = (address as ipaddr.IPv6).toIPv4Address();
  return address.range() === 'unicast';
}

/** DNS resolution happens inside each connection; TLS still verifies the original hostname. */
export function postCallback(urlString: string, body: string, headers: Record<string, string>, signal?: AbortSignal): Promise<{ status: number; body: string }> {
  const url = callbackUrl(urlString);
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  // Node bypasses lookup for literal IPs; reject them before creating a socket.
  if (isIP(hostname) && !publicAddress(hostname)) return Promise.reject(new Error('Callback destination is not a public address'));
  return new Promise((resolve, reject) => {
    const req = request(url, {
      method: 'POST', agent: false,
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
      headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(body)), ...headers },
      lookup: (_hostname, options, callback) => {
        const resolveAddresses = isIP(hostname)
          ? Promise.resolve([{ address: hostname, family: isIP(hostname) }])
          : lookup(hostname, { all: true, verbatim: true });
        void resolveAddresses.then(addresses => {
          if (!addresses.length || addresses.some(address => !publicAddress(address.address))) throw new Error('Callback destination is not a public address');
          const selected = addresses[0];
          if (options.all) callback(null, [selected]);
          else callback(null, selected.address, selected.family);
        }).catch(error => callback(error, ''));
      },
    }, response => {
      const chunks: Buffer[] = [];
      let length = 0;
      response.on('data', chunk => {
        length += chunk.length;
        if (length > 16_384) { response.destroy(new Error('Callback response exceeds 16 KiB')); return; }
        chunks.push(Buffer.from(chunk));
      });
      response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

/** Maps a failed callback attempt to a spec category; raw endpoint output never leaves this module. */
export function callbackFailure(error: unknown, status?: number): CallbackFailure {
  if (status !== undefined) return status >= 500 ? 'http_5xx' : 'http_4xx';
  const value = error as { code?: unknown; name?: unknown; cause?: unknown } | undefined;
  const code = String(value?.code ?? (value?.cause as { code?: unknown } | undefined)?.code ?? '');
  if (value?.name === 'TimeoutError' || code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT' || code === 'ABORT_ERR') return 'timeout';
  if (/^(ERR_TLS|ERR_SSL|CERT_|UNABLE_TO|DEPTH_ZERO|SELF_SIGNED|ERR_OSSL)/.test(code) || code.includes('CERT')) return 'tls_error';
  return 'connection_refused';
}
