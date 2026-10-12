import type { Hono } from 'hono';
import type { Config } from '@open-wa/schema';
import type { CallingService } from '@open-wa/core';
import type { upgradeWebSocket } from '@hono/node-server';
import { z } from 'zod';
import { getConnInfo } from '@hono/node-server/conninfo';
import { encodeAudioPacket } from '@open-wa/schema';

const requestSchema = z.object({
  call: z.object({ id: z.string(), sessionId: z.string(), generation: z.string() }).optional(),
  to: z.string().optional(), mode: z.enum(['accept', 'start', 'replace', 'observe']), microphone: z.boolean(), speaker: z.boolean(),
  replacesId: z.string().optional(),
  onMediaFailure: z.enum(['end', 'keep-open']).optional(),
});

export function registerCallingRoutes(app: Hono, options: {
  config: Config; getService: () => CallingService | undefined; upgrade: typeof upgradeWebSocket;
}) {
  const authorized = (c: Parameters<typeof getConnInfo>[0], key?: string) => {
    if (options.config.apiKey) return key === options.config.apiKey;
    const address = getConnInfo(c).remote.address;
    return address === '::1' || address === '127.0.0.1' || address === '::ffff:127.0.0.1';
  };
  app.post('/api/calls/media', async c => {
    if (!authorized(c, c.req.header('X-API-Key'))) return c.json({ error: 'Calling media requires configured API authentication for remote clients.' }, 401);
    const parsed = requestSchema.safeParse(await c.req.json().catch(() => undefined));
    if (!parsed.success) return c.json({ error: 'Invalid call media request' }, 400);
    const service = options.getService();
    if (!service) return c.json({ ok: false, status: 'unavailable', reason: { code: 'CALLING_UNAVAILABLE', message: 'The calling session is not ready.', status: 503 } });
    return c.json(await service.admitRemote(parsed.data));
  });
  app.get('/api/calls/media/ws', options.upgrade(c => {
    const origin = c.req.header('Origin');
    const requestOrigin = new URL(c.req.url).origin;
    const configured = Array.isArray(options.config.cors) ? options.config.cors : String(options.config.cors).split(',').map(item => item.trim());
    const originAllowed = !origin || origin === requestOrigin || (Boolean(options.config.apiKey) && (configured.includes('*') || configured.includes(origin)));
    let remote: ReturnType<CallingService['connectRemote']> | undefined;
    let service: CallingService | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let ticket = '';
    let failure: string | undefined;
    let sequence = 0, audioTimeMs = 0, lastDropNoticeAt = 0, droppedMs = 0;
    return {
      onOpen(_event, ws) {
        if (!originAllowed) { ws.close(1008, 'Origin is not allowed'); return; }
        timer = setTimeout(() => ws.close(1008, 'Call media handshake timed out'), 10_000);
        timer.unref?.();
      },
      onMessage(event, ws) {
        try {
          if (!remote) {
            if (typeof event.data !== 'string' || event.data.length > 16_384) throw new Error('Expected call media handshake');
            const handshake = JSON.parse(event.data);
            if (!authorized(c, handshake.apiKey) || handshake.version !== 1 || handshake.type !== 'start' || typeof handshake.ticket !== 'string') throw new Error('Unauthorized call media');
            service = options.getService();
            if (!service) throw new Error('Calling session unavailable');
            ticket = handshake.ticket;
            remote = service.connectRemote(ticket, {
              async send(bytes, timestampMs) {
                if (ws.readyState !== 1) throw new Error('Call media disconnected');
                const time = timestampMs ?? audioTimeMs; audioTimeMs = time + bytes.length / 32;
                const frameSequence = sequence++;
                if (((ws.raw as { bufferedAmount?: number })?.bufferedAmount ?? 0) > 16_000) {
                  droppedMs += bytes.length / 32;
                  if (Date.now() - lastDropNoticeAt >= 5000) { console.warn('Calling playback transport dropped audio while the client caught up; the call remains open.', { discardedMs: droppedMs }); droppedMs = 0; lastDropNoticeAt = Date.now(); }
                  return;
                }
                ws.send(encodeAudioPacket(bytes, frameSequence, time));
              },
              activate(callId) { ws.send(JSON.stringify({ type: 'active', callId })); },
              close() { ws.close(1000, 'Call ended'); },
            });
            clearTimeout(timer);
            ws.send(JSON.stringify({ type: 'ready', version: 1, format: { encoding: 'pcm16le', sampleRate: 16_000, channels: 1 } }));
            return;
          }
          if (typeof event.data === 'string') {
            if (event.data.length > 4096) throw new Error('Oversized call media message');
            const message = JSON.parse(event.data);
            if (message.type === 'end') ws.close(1000, 'Media client ended');
            else if (message.type === 'input-error' && typeof message.message === 'string') void service?.remoteInputFailed(ticket, message.message.slice(0, 512)).catch(error => console.warn('Calling microphone recovery failed:', String(error)));
            else if (message.type === 'error' && typeof message.message === 'string') { failure = message.message.slice(0, 512).trim() || 'The dashboard media source failed.'; ws.close(1011, 'Media source failed'); }
          } else remote.push(new Uint8Array(event.data as ArrayBuffer));
        } catch (error) {
          failure = remote && error instanceof Error ? error.message : 'Invalid or unavailable call media';
          if (remote) ws.send(JSON.stringify({ type: 'error', message: failure }));
          ws.close(1008, 'Invalid or unavailable call media');
        }
      },
      onClose(event) { clearTimeout(timer); if (ticket) void service?.remoteDisconnected(ticket, failure ?? `Call media connection closed (WebSocket ${event.code}${event.reason ? `: ${event.reason}` : ''}).`); },
      onError() { clearTimeout(timer); if (ticket) void service?.remoteDisconnected(ticket, failure ?? 'The call media WebSocket connection failed.'); },
    };
  }));
}
