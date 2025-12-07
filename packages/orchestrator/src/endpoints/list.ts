import { Request, Response } from "express";
import pm2 from 'pm2'
import { bucket } from "../data/bucket";
import { log } from "../utils/logging";
import { getProcessDescriptions } from "../utils/process_utils";


export const getPm2List: () => Promise<{
  /**
   * The name of the process
   */
  name: string,
  /**
   * The possible port of the process
   */
  port?: number,
  /**
   * The status of the PM2 proc
   */
  status: string,
  /**
   * The axm monitor
   */
  monit: any,
  /**
   * The version of the process. In most cases it will be the open-wa/wa-automate version.
   */
  version: string
}[]> = async () => {
  return await new Promise((resolve, reject) => {
    pm2.list(async (err, list) => {
      if (err) {
        log.error('/list', err)
        reject(err)
      }
      const _l = await Promise.all(list.map((p) => {
        const description = getProcessDescriptions(p?.name || "");
        return {
          ...p,
          ...description
        }
      }))
      resolve((_l as any[]).map(({ name, pm2_env, version }) => ({ name, port: (pm2_env as any).port,  status: (pm2_env as any).status, monit: (pm2_env as any)?.axm_monitor || {}, version: version || (pm2_env as any)?.version || "" })))
    });
  })
}

export const list: (req: Request, res: Response) => Promise<any> = async (req: Request, res: Response) => {
  const processes = await getPm2List();
  const final = processes.filter(({ name }) => name !== 'admin').map(p=>({
    ...p,
    stopReason: p.status === "stopped" ? bucket?.sessions.get(p.name)?.stopReason ||  'UNKNOWN': undefined
  }))
  return res.send(final)
}