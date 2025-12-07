import { Request, Response, NextFunction } from "express";
import pm2 from 'pm2'
import { readFileSync } from 'fs'
import { bucket } from "../data/bucket";
import { log } from "../utils/logging";

// @ts-ignore
export const logs: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined = async (req : Request, res : Response, next : NextFunction) => {
    const sessionId: string = req.params.id;
    if (sessionId === "admin") return res.status(404).send({
        error: "admin sessionId not found"
    })
    if(!sessionId) return res.send({
      success: false,
      sessionId,
      message: 'Please provide a sessionId'
    });
    if (bucket?.sessions.has(sessionId)) {
        let logs = 'Logs: ';
        const processDescription = (await bucket?.sessions.get(sessionId)?.getProcessDescription());
        log.info("🚀 ~ file: logs.ts ~ line 14 ~ processDescription", processDescription)
        if (processDescription?.pm2_env?.pm_out_log_path) {
            logs = logs + readFileSync(processDescription?.pm2_env?.pm_out_log_path, 'utf8')
        }
        if (processDescription?.pm2_env?.pm_err_log_path) {
            logs = logs + readFileSync(processDescription?.pm2_env?.pm_err_log_path, 'utf8')
        }
        return res.send(logs)
    } else {
        return res.status(404).send({
            error: "sessionId not found"
        })
    }
}