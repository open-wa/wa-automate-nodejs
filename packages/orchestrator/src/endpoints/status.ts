import type { Context } from 'hono';
import pm2 from 'pm2';
import { bucket } from '../data/bucket';
import { log } from '../utils/logging';

export async function status(c: Context) {
  return new Promise<Response>((resolve) => {
    pm2.list((err, list) => {
      if (err) log.error('/status', err);
      const process = list.find(({ name }) => name === 'admin');
      const b = bucket?.toJSON();
      resolve(c.json({ ...b, process }));
    });
  });
}