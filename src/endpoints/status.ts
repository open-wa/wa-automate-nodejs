import { Request, Response } from "express";
import pm2 from 'pm2'
import { bucket } from "../data/bucket";
import { log } from "../utils/logging";

export const status : (req: Request, res: Response) => Promise<void> = async (req: Request, res: Response) => {
    await pm2.list((err, list) => {
      if(err) log.error('/status', err)
      const process = list.find(({name})=>name=='admin');
      const b = bucket?.toJSON()
      return res.json({
          ...b,
          process
      })
    });
  }