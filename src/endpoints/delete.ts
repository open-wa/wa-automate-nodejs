import { Request, Response } from "express";
import { bucket } from "../data/bucket";
import { log } from "../utils/logging";
import { forceDeleteSessionData } from "../watcher/firebase_init";


export const deleteMiddleware: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req: Request, res: Response)  => {
    const {sessionId} = req.body;
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
        try {
          await bucket?.sessions.get(sessionId)?.delete()
        } catch (error) {
          log.error(`Something went wrong deleting the session ${sessionId}}`, error)
        }
        bucket?.sessions?.delete(sessionId)
       }
      return res.send({
        success: true,
        sessionId,
        message: `deleted: ${sessionId}`
      });
    } catch (error : any) {
      log.error("🚀 ~ file: delete.ts ~ line 24 ~ constdeleteMiddleware: ~ error", error)
      return res.send({
        success: false,
        sessionId,
        message: error?.message || error || '??'
      });
    }
  }




export const forceDeleteSessionDataFromOWABucket: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req: Request, res: Response)  => {
  const {sessionId} = req.body;
  if(sessionId==='admin') return res.send({
    success: false,
    sessionId,
    message: 'You cannot use admin'
  })
  try {
    const deleteResult = await forceDeleteSessionData({
      sessionId
    })
    if(deleteResult) {
      return res.send({
        success: true,
        sessionId,
        message: `deleted: ${sessionId}`
      });
    } else 
    return res.send({
      success: false,
      sessionId
    });
  } catch (error : any) {
    log.error("🚀 ~ file: delete.ts ~ line 58 ~ constforceDeleteSessionDataFromOWABucket: ~ error", error)
    return res.send({
      success: false,
      sessionId,
      message: error?.message || error || '??'
    });
  }
}