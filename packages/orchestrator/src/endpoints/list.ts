import type { Context } from 'hono';
import pm2 from 'pm2';
import { bucket } from '../data/bucket';
import { log } from '../utils/logging';
import { getProcessDescriptions } from '../utils/process_utils';

export interface Pm2ProcessInfo {
  name: string;
  port?: number;
  status: string;
  monit: any;
  version: string;
}

export async function getPm2List(): Promise<Pm2ProcessInfo[]> {
  return new Promise((resolve, reject) => {
    pm2.list(async (err, list) => {
      if (err) {
        log.error('/list', err);
        reject(err);
        return;
      }

      const enriched = await Promise.all(
        list.map((p) => {
          const description = getProcessDescriptions(p?.name || '');
          return { ...p, ...description };
        }),
      );

      resolve(
        (enriched as any[]).map(({ name, pm2_env, version }) => ({
          name,
          port: (pm2_env as any).port,
          status: (pm2_env as any).status,
          monit: (pm2_env as any)?.axm_monitor || {},
          version: version || (pm2_env as any)?.version || '',
        })),
      );
    });
  });
}

export async function list(c: Context) {
  const processes = await getPm2List();

  const result = processes
    .filter(({ name }) => name !== 'admin')
    .map((p) => ({
      ...p,
      stopReason: p.status === 'stopped' ? bucket?.sessions.get(p.name)?.stopReason || 'UNKNOWN' : undefined,
    }));

  return c.json(result);
}