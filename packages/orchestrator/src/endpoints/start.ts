import type { Context } from 'hono';
import { stopManager } from '../controllers/pm2_controller';
import { bucket } from '../data/bucket';
import { log } from '../utils/logging';
import { getPm2List } from './list';

export async function start(c: Context) {
  const { sessionId } = await c.req.json();
  log.info('start sessionId', sessionId);

  if (sessionId === 'admin') {
    return c.json({ success: false, sessionId, message: 'You cannot use admin' });
  }

  if (!sessionId) {
    return c.json({ success: false, sessionId, message: 'Please provide a sessionId' });
  }

  try {
    if (!bucket?.sessions.has(sessionId)) {
      return c.json(
        {
          success: false,
          sessionId,
          message: `Session does not exist in this bucket. Please use /create instead: ${sessionId}`,
          code: 404,
        },
        404,
      );
    }

    let startType = 'RESURRECTED';
    stopManager.preventAutoStop(sessionId);

    log.info('Session exists in bucket. Checking PM2 process state...');
    const pm2Proc = (await getPm2List()).find(({ name }) => name === sessionId);

    if (pm2Proc) {
      if (pm2Proc.status === 'stopped') {
        startType = 'STARTED';
        log.info('Session is stopped. Starting it.', pm2Proc);
        await bucket?.sessions.get(sessionId)?.start();
      } else {
        startType = `STATE_UNCHANGED - ${pm2Proc.status}`;
        log.info("Session can't be started again due to current state. Use /restart or /reload.", sessionId, pm2Proc.status);
      }
    } else {
      await bucket?.sessions.get(sessionId)?.attemptRecreation();
    }

    return c.json({ success: true, sessionId, message: `${startType}: ${sessionId}` });
  } catch (error: any) {
    log.error('start error', error);
    return c.json({
      success: false,
      sessionId,
      message: error?.message || error || 'Unknown error',
    });
  }
}