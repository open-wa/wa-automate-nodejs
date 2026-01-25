import { Router, Request, Response } from 'express';
import type { Client } from '@open-wa/client';
import type { CliOptions } from '../../options.js';

export function createHealthRoutes(client: Client, options: CliOptions): Router {
  const router = Router();
  
  router.get('/', (_req: Request, res: Response) => {
    const state = client.getState();
    const isHealthy = state === 'READY';
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      state,
      sessionId: options.sessionId,
      timestamp: new Date().toISOString(),
    });
  });
  
  router.get('/live', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  });
  
  router.get('/ready', (_req: Request, res: Response) => {
    const state = client.getState();
    const isReady = state === 'READY';
    
    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not_ready',
      state,
      sessionId: options.sessionId,
      timestamp: new Date().toISOString(),
    });
  });
  
  return router;
}
