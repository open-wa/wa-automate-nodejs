import { Request, Response, NextFunction } from 'express';
import type { Logger } from '@open-wa/logger';

export function createApiKeyMiddleware(apiKey: string, logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.path === '/health' || req.path === '/health/live' || req.path === '/health/ready') {
      next();
      return;
    }
    
    const providedKey = 
      req.headers['x-api-key'] as string ||
      req.headers.authorization?.replace('Bearer ', '') ||
      req.query.key as string;
    
    if (!providedKey) {
      logger.warn('auth_missing_key', { ip: req.ip, path: req.path });
      res.status(401).json({ error: 'API key required' });
      return;
    }
    
    if (providedKey !== apiKey) {
      logger.warn('auth_invalid_key', { ip: req.ip, path: req.path });
      res.status(403).json({ error: 'Invalid API key' });
      return;
    }
    
    next();
  };
}
