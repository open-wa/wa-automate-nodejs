import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { Server } from 'http';
import type { Client } from '@open-wa/client';
import type { Logger } from '@open-wa/logger';
import type { CliOptions } from '../options.js';
import { createApiRoutes } from './routes/api.js';
import { createHealthRoutes } from './routes/health.js';
import { createApiKeyMiddleware } from './middleware/apiKey.js';

export interface ServerConfig {
  client: Client;
  options: CliOptions;
  logger: Logger;
}

export interface ServerInstance {
  app: Express;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export async function createServer(config: ServerConfig): Promise<ServerInstance> {
  const { client, options, logger } = config;
  
  const app = express();
  let server: Server | null = null;
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  if (options.cors) {
    app.use(cors());
    logger.info('cors_enabled');
  }
  
  if (options.helmet) {
    app.use(helmet());
    logger.info('helmet_enabled');
  }
  
  if (options.apiKey) {
    app.use(createApiKeyMiddleware(options.apiKey, logger));
    logger.info('api_key_auth_enabled');
  }
  
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug('http_request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    next();
  });
  
  app.use('/health', createHealthRoutes(client, options));
  app.use('/api', createApiRoutes(client, options, logger));
  
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: '@open-wa/cli',
      sessionId: options.sessionId,
      state: client.getState(),
      endpoints: {
        health: '/health',
        api: '/api',
      },
    });
  });
  
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('http_error', { error: err.message, stack: err.stack });
    res.status(500).json({
      error: 'Internal Server Error',
      message: options.debug ? err.message : undefined,
    });
  });
  
  return {
    app,
    
    async start(): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          server = app.listen(options.port, options.host, () => {
            resolve();
          });
          
          server.on('error', (err) => {
            logger.error('server_error', { error: err });
            reject(err);
          });
        } catch (err) {
          reject(err);
        }
      });
    },
    
    async stop(): Promise<void> {
      return new Promise((resolve, reject) => {
        if (!server) {
          resolve();
          return;
        }
        
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            server = null;
            resolve();
          }
        });
      });
    },
  };
}
