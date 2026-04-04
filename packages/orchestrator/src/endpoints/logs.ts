import type { Context } from 'hono';
import { readFileSync } from 'fs';
import { bucket } from '../data/bucket';
import { log } from '../utils/logging';

export async function logs(c: Context) {
  const sessionId = c.req.param('id');

  if (sessionId === 'admin') {
    return c.json({ error: 'admin sessionId not found' }, 404);
  }

  if (!sessionId) {
    return c.json({ success: false, sessionId, message: 'Please provide a sessionId' });
  }

  if (!bucket?.sessions.has(sessionId)) {
    return c.json({ error: 'sessionId not found' }, 404);
  }

  let logContent = 'Logs: ';

  try {
    const processDescription = await bucket?.sessions.get(sessionId)?.getProcessDescription();
    log.info('logs processDescription', processDescription);

    if (processDescription?.pm2_env?.pm_out_log_path) {
      logContent += readFileSync(processDescription.pm2_env.pm_out_log_path, 'utf8');
    }
    if (processDescription?.pm2_env?.pm_err_log_path) {
      logContent += readFileSync(processDescription.pm2_env.pm_err_log_path, 'utf8');
    }
  } catch (error) {
    log.error('Failed to read logs for session', sessionId, error);
  }

  return c.text(logContent);
}