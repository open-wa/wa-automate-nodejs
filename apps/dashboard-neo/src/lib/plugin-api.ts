import { getApiKey, getApiUrl } from './api-client';

/** Plugin paths are scoped to the selected package and current Easy API connection. */
export async function pluginRequest(name: string, path: string, init: RequestInit = {}): Promise<Response> {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error('Invalid plugin name.');
  const base = new URL(getApiUrl(), location.origin);
  base.search = ''; base.hash = '';
  const prefix = `/plugins/${encodeURIComponent(name)}/`;
  const target = new URL(prefix + path.replace(/^\//, ''), base);
  if (target.origin !== base.origin || !target.pathname.startsWith(prefix)) throw new Error('Plugin request escaped its route.');
  const headers = new Headers(init.headers);
  const key = getApiKey(); if (key) headers.set('X-API-Key', key);
  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(target, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Plugin request returned HTTP ${response.status}.`);
  }
  return response;
}

export async function pluginJson<T = unknown>(name: string, path: string, init?: RequestInit): Promise<T> {
  return (await pluginRequest(name, path, init)).json();
}

export async function watchPlugin(name: string, path: string, receive: (snapshot: unknown) => void, signal: AbortSignal): Promise<void> {
  const response = await pluginRequest(name, path, { signal });
  if (!response.body) throw new Error('The plugin event stream is unavailable.');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read(); if (done) break;
      buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n');
      if (buffer.length > 2_000_000) throw new Error('Plugin event exceeded the dashboard limit.');
      let end: number;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, end); buffer = buffer.slice(end + 2);
        if (!block.split('\n').some(line => line === 'event: snapshot')) continue;
        const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (data) receive(JSON.parse(data));
      }
    }
    signal.throwIfAborted();
    throw new Error('The live connection ended. Reconnecting…');
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
