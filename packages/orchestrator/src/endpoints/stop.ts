import { Request, Response } from "express";
import { bucket } from "../data/bucket";
import { log } from "../utils/logging";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const stopProcess = async (sessionId: string, reason: string) => await bucket?.sessions.get(sessionId)?.stop(reason)

export const stop : (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req: Request, res: Response) => {
    const {sessionId} = req.body;
    log.info("🚀 ~ stop: ~ sessionId", sessionId)
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
      if(bucket?.sessions.has(sessionId)){
         await bucket?.sessions.get(sessionId)?.stop("STOP API_REQUEST")
        }
      return res.send({
        success: true,
        sessionId,
        message: `stopped: ${sessionId}`
      });
    } catch (error : any) {
      log.error("🚀 ~ file: stop.ts ~ line 22 ~ stop: ~ error", error)
      return res.send({
        success: false,
        sessionId,
        message: error?.message || error || '??'
      });
    }
  }