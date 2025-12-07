import pm2 from 'pm2'
import { Request, Response } from "express";
import PQueue from "p-queue";
import { MainProcessHandlingQueue } from "../controllers/background_q";
import { stopManager } from "../controllers/pm2_controller";
import { bucket } from "../data/bucket";
import { log } from "../utils/logging";
import { getPm2List } from "./list";

const restartQueue =  new PQueue({
  concurrency: 1,
  intervalCap: 1,
  // interval: 10000,
  // timeout: 10000,
  carryoverConcurrencyCount: true
})


/**
 * @param background boolean if set to true, this function will return before waiting for the all processes to restart. If remaining restarts are left, it will return with the result
 */
export const _restartAll: (background ?: boolean) => Promise<{
  restarts: pm2.Proc[];
  errors: Error[];
} | any> | any = async (background ?: boolean) => {
  if(background && restartQueue.pending) {
      return  restartQueue.pending
  }
  //wait for all current process managements are finished
  await MainProcessHandlingQueue.onEmpty();
  // const errors: Error[] = [];
  // const reloadPromises : Promise<pm2.Proc>[] | any= [];
  const restarts : any []= [];
  await restartQueue.onEmpty()
  bucket?.sessions.forEach(async (session) => {
      log.info("Adding session to restart queue", session.sessionId);
      restartQueue.add(async ()=>{
        stopManager.preventAutoStop(session.sessionId)
        const r = await session.restart()
        restarts.push(r);
        return;
      })
  });
  if(background) {
    return  restartQueue.pending
  }
  await restartQueue.onEmpty()
  const processes = await getPm2List();
  log.info("All sessions restarted" , restarts)
  return restarts.map(r => ({
    ...r,
    version: processes.find(p => p.name === r.sessionId)?.version || "",
    status: processes.find(p => p.name === r.sessionId)?.status || ""
  }))
}

export const restartAll: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req: Request, res: Response) => {
  const {background} = req.body;
  //restart all
  const restarts = await _restartAll(background || false)
  return res.send({
    status: background ? "restarted" : "background restarts ongoing",
    restarts: background ? undefined: restarts,
    pendingRestarts: background ? restarts : 0
  })
}

export const restart: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async  (req: Request, res: Response) => {
    const {sessionId} = req.body;
    log.info("🚀 ~ restart: ~ sessionId", sessionId)
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
      if(bucket?.sessions.has(sessionId)) {
        stopManager.preventAutoStop(sessionId)
        await bucket?.sessions.get(sessionId)?.restart()
        return res.send({
          success: true,
          sessionId,
          message: `${sessionId} restarted`
        })
      }
      return await res.send({
        success: false,
        sessionId,
        message: `${sessionId} is not started. Use '/create'`
      })
    } catch (error : any) {
      log.error("🚀 ~ file: restart.ts ~ line 27 ~ restart: ~ error", error)
      return res.send({
        success: false,
        sessionId,
        message: error?.message || error || '??'
      });
    }
  }