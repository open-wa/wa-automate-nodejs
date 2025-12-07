import { Request, Response } from "express";
import pm2 from 'pm2'

export const flush: (req: Request, res: Response) => Promise<void> = async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    const _flush = procId => new Promise((resolve, reject) => pm2.flush(procId, (err, res) => {
        if (err) reject(err);
        resolve(res)
    }))

    try {
        const result = await _flush(sessionId)
        res.send({
            success: true,
            sessionId,
            message: `flushed: ${sessionId}`,
            result
        })
        return;
    } catch (error: any) {
        console.log("🚀 ~ file: flush.ts ~ line 19 ~ conststatus: ~ error", error)
        res.send({
            success: false,
            sessionId,
            message: error["message"] || error || '??'
        });
        return;
    }
}