import { NextFunction, Request, Response } from "express";
import { bucket } from "../data/bucket";
import { OrchState, SessionState } from "../data/state";
import { log } from "../utils/logging";
import { getPm2List } from "./list";
import { RequestHandler } from 'http-proxy-middleware';


export const proxy: (req: Request, res: Response, next: NextFunction) => any = async function (req: Request, res: Response, next: NextFunction) {
    /**
     * TODO CAPTURE KILL COMMAND - SEND STOP REQUEST TO THE PROCESS
     */
    const sessionId: string = req.params.id;
    if (sessionId === 'admin') return res.send({
        success: false,
        sessionId,
        message: 'You cannot use admin'
    })
    if(bucket?.sessions.has(sessionId)) {
        const _proxyReq = (await bucket?.sessions.get(sessionId)?.getProxyMiddleware() as RequestHandler)(req, res, next);
        //TODO CHECK IF THIS IS STILL REQUIRED
        // if(req.path.endsWith("/kill")) {
        //     bucket?.sessions.get(sessionId)?.stop();
        // }
        if(process.env.FORCE_PORT_REPORT_ON_EVERY_REQUEST) await bucket?.sessions.get(sessionId)?.forcePortReport();
        return _proxyReq
    } else {
        //check pm2 list:
        const procList = await getPm2List();
        const possibleProcess = procList.find(({ name }) => name === sessionId);
        if(possibleProcess && possibleProcess.port) {
            log.info(`Found an orphaned process. Present in PM2 but not in bucket. Proxying ${sessionId}}`)
            const orphanSessionState = new SessionState(sessionId, `http://localhost:${possibleProcess.port}/`)
            bucket?.sessions?.set(sessionId, orphanSessionState);
            return (await orphanSessionState.getProxyMiddleware())(req, res, next);
        } else
        return res.send({
            success: false,
            sessionId,
            message: `${sessionId} does not exist in this bucket. Use '/create'`
        })
    } 
    next();
}

///function to query the pm2 list of processes for a given session id