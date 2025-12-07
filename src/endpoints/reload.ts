import pm2 from 'pm2'
import { Request, Response } from "express";
import { bucket } from '../data/bucket';
import { log } from '../utils/logging';
import PQueue from 'p-queue';
import { getPm2List } from './list';
import { MainProcessHandlingQueue } from '../controllers/background_q';
import { stopManager } from '../controllers/pm2_controller';

const reloadQueue =  new PQueue({
  concurrency: 1,
  intervalCap: 1,
  // interval: 10000,
  // timeout: 10000,
  carryoverConcurrencyCount: true
})



export const _reloadAll: () => Promise<{
  reloads: pm2.Proc[];
  errors: Error[];
} | any> | any = async () => {
  //wait for all current process managements are finished
  await MainProcessHandlingQueue.onEmpty();
  // const errors: Error[] = [];
  // const reloadPromises : Promise<pm2.Proc>[] | any= [];
  const reloads : any []= [];
  await reloadQueue.onEmpty()
  bucket?.sessions.forEach(async (session) => {
    if(session.processState == "online" || session.processState == "reload") {
      log.info("Adding session to reload queue", session.sessionId);
      reloadQueue.add(async ()=>{
        const r = await session.reload()
        reloads.push(r);
        return;
      })
    }
  });
  await reloadQueue.onEmpty()
  const processes = await getPm2List();
  log.info("All sessions reloaded" , reloads)
  return reloads.map(r => ({
    ...r,
    version: processes.find(p => p.name === r.sessionId)?.version || "",
    status: processes.find(p => p.name === r.sessionId)?.status || ""
  }))
}

export const reloadAll: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req: Request, res: Response) => {
  //reload all
  const sessionReloads = await _reloadAll()
  return res.send({
    status: "reloaded",
    sessionReloads
  })
}

export const reload : (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>=  async (req: Request, res: Response) => {
  const {sessionId} = req.body;
  log.info("🚀 ~ reload ~ sessionId", sessionId)
  if(sessionId==='admin') return res.send({
    success: false,
    sessionId,
    message: 'You cannot use admin'
  })
  if(!sessionId) return res.send({
    success: false,
    sessionId,
    message: 'Please provide a sessionId'
  });
   try {
     if(!bucket?.sessions) return res.send("No sessions detected")
    if(!bucket?.sessions.has(sessionId)) return res.send(`${sessionId} not running`);
    stopManager.preventAutoStop(sessionId)
    await bucket.sessions.get(sessionId)?.reload()
    return res.send({
     success: true,
     sessionId,
     message: `reloaded: ${sessionId}`
   });
   } catch (error : any) {
    log.error("🚀 ~ file: reload.ts ~ line 45 ~ constreload: ~ error", error)
    return res.send({
      success: false,
      sessionId,
      message: error?.message || error || '??'
    });
   }
 }