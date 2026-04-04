import type { Context } from 'hono';
import { bucket } from '../data/bucket';
import { log } from '../utils/logging';
import { forceDeleteSessionData } from '../watcher/firebase_init';

export async function deleteSession(c: Context) {
  const { sessionId } = await c.req.json();

  if (sessionId === 'admin') {
    return c.json({ success: false, sessionId, message: 'You cannot use admin' });
  }

  if (!sessionId) {
    return c.json({ success: false, sessionId, message: 'Please provide a sessionId' });
  }

  try {
    if (bucket?.sessions.has(sessionId)) {
      try {
        await bucket?.sessions.get(sessionId)?.delete();
      } catch (error) {
        log.error(`Something went wrong deleting the session ${sessionId}`, error);
      }
      bucket?.sessions?.delete(sessionId);
    }

    return c.json({ success: true, sessionId, message: `deleted: ${sessionId}` });
  } catch (error: any) {
    log.error('deleteSession error', error);
    return c.json({
      success: false,
      sessionId,
      message: error?.message || error || 'Unknown error',
    });
  }
}

export async function forceDeleteSessionDataFromOWABucket(c: Context) {
  const { sessionId } = await c.req.json();

  if (sessionId === 'admin') {
    return c.json({ success: false, sessionId, message: 'You cannot use admin' });
  }

  try {
    const deleteResult = await forceDeleteSessionData({ sessionId });

    if (deleteResult) {
      return c.json({ success: true, sessionId, message: `deleted: ${sessionId}` });
    }

    return c.json({ success: false, sessionId });
  } catch (error: any) {
    log.error('forceDeleteSessionDataFromOWABucket error', error);
    return c.json({
      success: false,
      sessionId,
      message: error?.message || error || 'Unknown error',
    });
  }
}