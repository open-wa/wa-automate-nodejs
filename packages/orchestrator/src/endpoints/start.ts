import { Request, Response } from "express";
import { stopManager } from "../controllers/pm2_controller";
import { bucket } from "../data/bucket";
import { log } from "../utils/logging";
import { getPm2List } from "./list";

export const start : (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req: Request, res: Response) => {
    const {sessionId} = req.body;
    log.info("🚀 ~ start: ~ sessionId", sessionId)
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
      let startType = "RESURRECTED"
      if(bucket?.sessions.has(sessionId)){
        stopManager.preventAutoStop(sessionId)
        log.info("This session already exists in the bucket. Checking if it exists in the local list of pm2 processes, maybe it's stopped?")
        //IF THE SESSION ALREADY EXISTS IN THE LOCAL PM2 LIST OF PROCESSES THEN JUST START IT!!! DO NOT ATTEMPT RESURRECTION!!
        const pm2Proc = (await getPm2List()).find(({ name }) => name == sessionId)
        if(pm2Proc){
          if(pm2Proc.status === "stopped") {
            startType = "STARTED"
            log.info("This session is stopped. Attempting to start it", pm2Proc)
            await bucket?.sessions.get(sessionId)?.start()
          } else {
            //session is already live in some way or the other
            startType = `STATE_UNCHANGED - ${pm2Proc.status}`
            log.info("This session cannot be started again due to it's current state. use /restart or /reload instead", sessionId,  pm2Proc.status)
          }
        } else await bucket?.sessions.get(sessionId)?.attemptRecreation()
      return res.send({
        success: true,
        sessionId,
        message: `${startType}: ${sessionId}`
      });
      } else {
        return res.send({
          success: false,
          sessionId,
          message: `Session does not exist in this bucket. Please use /create instead: ${sessionId}`,
          code: 404
        });
      }
    } catch (error : any) {
      log.error("🚀 ~ file: start.ts ~ line 22 ~ conststart: ~ error", error)
      return res.send({
        success: false,
        sessionId,
        message: error?.message || error || '??'
      });
    }
  }