import type { Context } from 'hono';
import { bucket } from '../data/bucket';
import { log } from '../utils/logging';

/**
 * Stop a PM2 process by session ID. Framework-agnostic — used both by the API handler and internal logic.
 */
export async function stopProcess(sessionId: string, reason: string) {
  return bucket?.sessions.get(sessionId)?.stop(reason);
}

export async function stop(c: Context) {
  const { sessionId } = await c.req.json();
  log.info('stop sessionId', sessionId);

  if (sessionId === 'admin') {
    return c.json({ success: false, sessionId, message: 'You cannot use admin' });
  }

  if (!sessionId) {
    return c.json({ success: false, sessionId, message: 'Please provide a sessionId' });
  }

  try {
    if (bucket?.sessions.has(sessionId)) {
      await bucket?.sessions.get(sessionId)?.stop('STOP API_REQUEST');
    }

    return c.json({ success: true, sessionId, message: `stopped: ${sessionId}` });
  } catch (error: any) {
    log.error('stop error', error);
    return c.json({
      success: false,
      sessionId,
      message: error?.message || error || 'Unknown error',
    });
  }
}