import type { Context } from 'hono';
import PQueue from 'p-queue';
import { MainProcessHandlingQueue } from '../controllers/background_q';
import { stopManager } from '../controllers/pm2_controller';
import { bucket } from '../data/bucket';
import { log } from '../utils/logging';
import { getPm2List } from './list';

const restartQueue = new PQueue({
  concurrency: 1,
  intervalCap: 1,
  carryoverConcurrencyCount: true,
});

/**
 * Restart all sessions.
 * @param background If true, returns immediately with the count of pending restarts.
 */
export async function _restartAll(background = false): Promise<any> {
  if (background && restartQueue.pending) {
    return restartQueue.pending;
  }

  await MainProcessHandlingQueue.onEmpty();

  const restarts: any[] = [];
  await restartQueue.onEmpty();

  bucket?.sessions.forEach((session) => {
    log.info('Adding session to restart queue', session.sessionId);
    restartQueue.add(async () => {
      stopManager.preventAutoStop(session.sessionId);
      const r = await session.restart();
      restarts.push(r);
    });
  });

  if (background) {
    return restartQueue.pending;
  }

  await restartQueue.onEmpty();
  const processes = await getPm2List();
  log.info('All sessions restarted', restarts);

  return restarts.map((r) => ({
    ...r,
    version: processes.find((p) => p.name === r.sessionId)?.version || '',
    status: processes.find((p) => p.name === r.sessionId)?.status || '',
  }));
}

export async function restartAll(c: Context) {
  const { background } = await c.req.json();
  const restarts = await _restartAll(background || false);

  return c.json({
    status: background ? 'background restarts ongoing' : 'restarted',
    restarts: background ? undefined : restarts,
    pendingRestarts: background ? restarts : 0,
  });
}

export async function restart(c: Context) {
  const { sessionId } = await c.req.json();
  log.info('restart sessionId', sessionId);

  if (sessionId === 'admin') {
    return c.json({ success: false, sessionId, message: 'You cannot use admin' });
  }

  if (!sessionId) {
    return c.json({ success: false, sessionId, message: 'Please provide a sessionId' });
  }

  try {
    if (bucket?.sessions.has(sessionId)) {
      stopManager.preventAutoStop(sessionId);
      await bucket?.sessions.get(sessionId)?.restart();
      return c.json({ success: true, sessionId, message: `${sessionId} restarted` });
    }

    return c.json({
      success: false,
      sessionId,
      message: `${sessionId} is not started. Use '/create'`,
    });
  } catch (error: any) {
    log.error('restart error', error);
    return c.json({
      success: false,
      sessionId,
      message: error?.message || error || 'Unknown error',
    });
  }
}