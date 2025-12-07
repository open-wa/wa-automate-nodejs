import { Request, Response } from "express";
import crossSpawn from 'cross-spawn'
import { _reloadAll } from "./reload";
import { log } from "../utils/logging";
import { _restartAll } from './restart';
import PQueue from "p-queue";

const updateQueue =  new PQueue({
  concurrency: 1,
  intervalCap: 1,
  // interval: 10000,
  // timeout: 10000,
  carryoverConcurrencyCount: true
})

const _update = () => new Promise((resolve, reject) => {
  const cmd = crossSpawn.sync('npm', ['run', 'upd'], { stdio: 'inherit' });
  log.info('UPDATE FINISHED WITH STATUS CODE', cmd.status, cmd)
  if (cmd.stderr) {
    log.error(cmd.stderr.toString())
    reject(cmd.stderr?.toString())
  }
  if (cmd.status == 0) {
    log.info('STATUS 0', cmd.stdout)
    resolve(cmd.stdout?.toString() || true)
  }
})


export const update: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req: Request, res: Response) => {
    const {background} = req.body;
    try {
      if(background) {
        /**
         * Check if the queue is empty:
         */
        if(updateQueue.pending) {
          return res.send({
            status: "Update job still in progress",
            message: `${updateQueue.pending} update job(s) still pending.`
          });
        } else {
          updateQueue.add(async ()=>{
            return await _update()
          })
          return res.send({
            status: "Update job sent to background",
            message: `${updateQueue.pending} update job(s) pending.`
          });
        }
      }
    const result = await _update()
    return res.send({
      status: "updated",
      message: result
    });
  } catch (error) {
    log.error("Update failed", error)
    return res.send({
      status: "error",
      message: error
    })
  }
}

export const updateAndReloadAll: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req: Request, res: Response) => {
  try {
    const result = await _update();
    const reloads = await _reloadAll()
    log.info("🚀 ~ updateAndReloadAll: ~ reloads", reloads)
    return res.send({
      status: "updated and restarted",
      message: result,
      reloads
    })
  } catch (error) {
    log.error("Update failed", error)
    return res.send({
      status: "error",
      message: error
    })
  }
}

export const updateAndRestartAll: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>> = async (req: Request, res: Response) => {
  try {
    const result = await _update();
    const restarts = await _restartAll()
    log.info("🚀 ~ updateAndRestartAll: ~ restarts", restarts)
    return res.send({
      status: "updated and restarted",
      message: result,
      restarts
    })
  } catch (error) {
    log.error("Update failed", error)
    return res.send({
      status: "error",
      message: error
    })
  }
}