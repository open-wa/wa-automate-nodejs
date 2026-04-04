import type { Context } from 'hono';
import crossSpawn from 'cross-spawn';
import PQueue from 'p-queue';
import { _reloadAll } from './reload';
import { _restartAll } from './restart';
import { log } from '../utils/logging';

const updateQueue = new PQueue({
  concurrency: 1,
  intervalCap: 1,
  carryoverConcurrencyCount: true,
});

function _update(): Promise<string | true> {
  return new Promise((resolve, reject) => {
    const cmd = crossSpawn.sync('npm', ['run', 'upd'], { stdio: 'inherit' });
    log.info('UPDATE FINISHED WITH STATUS CODE', cmd.status, cmd);

    if (cmd.stderr) {
      log.error(cmd.stderr.toString());
      reject(cmd.stderr?.toString());
      return;
    }

    if (cmd.status === 0) {
      log.info('STATUS 0', cmd.stdout);
      resolve(cmd.stdout?.toString() || true);
    }
  });
}

export async function update(c: Context) {
  const { background } = await c.req.json();

  try {
    if (background) {
      if (updateQueue.pending) {
        return c.json({
          status: 'Update job still in progress',
          message: `${updateQueue.pending} update job(s) still pending.`,
        });
      }

      updateQueue.add(() => _update());
      return c.json({
        status: 'Update job sent to background',
        message: `${updateQueue.pending} update job(s) pending.`,
      });
    }

    const result = await _update();
    return c.json({ status: 'updated', message: result });
  } catch (error) {
    log.error('Update failed', error);
    return c.json({ status: 'error', message: error });
  }
}

export async function updateAndReloadAll(c: Context) {
  try {
    const result = await _update();
    const reloads = await _reloadAll();
    log.info('updateAndReloadAll reloads', reloads);
    return c.json({ status: 'updated and reloaded', message: result, reloads });
  } catch (error) {
    log.error('Update failed', error);
    return c.json({ status: 'error', message: error });
  }
}

export async function updateAndRestartAll(c: Context) {
  try {
    const result = await _update();
    const restarts = await _restartAll();
    log.info('updateAndRestartAll restarts', restarts);
    return c.json({ status: 'updated and restarted', message: result, restarts });
  } catch (error) {
    log.error('Update failed', error);
    return c.json({ status: 'error', message: error });
  }
}