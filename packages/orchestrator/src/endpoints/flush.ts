import type { Context } from 'hono';
import pm2 from 'pm2';

export async function flush(c: Context) {
  const { sessionId } = await c.req.json();

  const _flush = (procId: string) =>
    new Promise((resolve, reject) =>
      pm2.flush(procId, (err, res) => {
        if (err) reject(err);
        resolve(res);
      }),
    );

  try {
    const result = await _flush(sessionId);
    return c.json({
      success: true,
      sessionId,
      message: `flushed: ${sessionId}`,
      result,
    });
  } catch (error: any) {
    console.error('flush error', error);
    return c.json({
      success: false,
      sessionId,
      message: error?.message || error || 'Unknown error',
    });
  }
}