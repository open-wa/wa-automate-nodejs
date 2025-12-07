import { Request, Response, NextFunction } from "express";
import { log } from "../utils/logging";
import { getLatestApiKey } from "../watcher/firebase_db";

export const authMiddleware: (req: Request, res: Response, next: NextFunction) => void = async (req: Request, res : Response, next : NextFunction) => {
    const h = (_h : string) => req.headers[_h] || req.get(_h) || req.headers[_h.toLowerCase()] || req.get(_h.toLowerCase()) 
    const apiKey = h("api_access_token") || h("api-access-token")
    const hasCfTokens = h("CF-Access-Client-Id") && h("CF-Access-Client-Secret")
    if(req.method == "GET" || req.path.includes('/api/') && !req.path.endsWith('/list')) {
      log.info('you can bypass auth');
      return next();
    } else
    if(hasCfTokens && process.env.CF_AUTH_ONLY) {
      return next()
    } else
    if (apiKey !== process.env.API_KEY) {
      /**
       * Attempt to get the new api_access_token
       */
      const latestKey = await getLatestApiKey();
      if(apiKey === latestKey) return next();
      log.info('you need to auth')
      res.status(401).json({error: 'unauthorised'})
    } else {
      return next()
    }
}
