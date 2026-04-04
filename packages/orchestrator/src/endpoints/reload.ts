import type { Context } from 'hono';
import type pm2 from 'pm2';
import PQueue from 'p-queue';
import { bucket } from '../data/bucket';
import { log } from '../utils/logging';
import { getPm2List } from './list';
import { MainProcessHandlingQueue } from '../controllers/background_q';
import { stopManager } from '../controllers/pm2_controller';

const reloadQueue = new PQueue({
  concurrency: 1,
  intervalCap: 1,
  carryoverConcurrencyCount: true,
});

export async function _reloadAll(): Promise<any[]> {
  await MainProcessHandlingQueue.onEmpty();

  const reloads: any[] = [];
  await reloadQueue.onEmpty();

  bucket?.sessions.forEach((session) => {
    if (session.processState === 'online' || session.processState === 'reload') {
      log.info('Adding session to reload queue', session.sessionId);
      reloadQueue.add(async () => {
        const r = await session.reload();
        reloads.push(r);
      });
    }
  });

  await reloadQueue.onEmpty();
  const processes = await getPm2List();
  log.info('All sessions reloaded', reloads);

  return reloads.map((r) => ({
    ...r,
    version: processes.find((p) => p.name === r.sessionId)?.version || '',
    status: processes.find((p) => p.name === r.sessionId)?.status || '',
  }));
}

export async function reloadAll(c: Context) {
  const sessionReloads = await _reloadAll();
  return c.json({ status: 'reloaded', sessionReloads });
}

export async function reload(c: Context) {
  const { sessionId } = await c.req.json();
  log.info('reload sessionId', sessionId);

  if (sessionId === 'admin') {
    return c.json({ success: false, sessionId, message: 'You cannot use admin' });
  }

  if (!sessionId) {
    return c.json({ success: false, sessionId, message: 'Please provide a sessionId' });
  }

  try {
    if (!bucket?.sessions) {
      return c.json({ success: false, message: 'No sessions detected' });
    }

    if (!bucket.sessions.has(sessionId)) {
      return c.json({ success: false, sessionId, message: `${sessionId} not running` });
    }

    stopManager.preventAutoStop(sessionId);
    await bucket.sessions.get(sessionId)?.reload();

    return c.json({ success: true, sessionId, message: `reloaded: ${sessionId}` });
  } catch (error: any) {
    log.error('reload error', error);
    return c.json({
      success: false,
      sessionId,
      message: error?.message || error || 'Unknown error',
    });
  }
}