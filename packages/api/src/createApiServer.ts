import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getRequestListener } from '@hono/node-server';
import { createServer } from 'http';
import { createNodeWebSocket } from '@hono/node-ws';
import { Server as SocketIOServer } from 'socket.io';
import { getHttpMethodDefinitions, type Config } from '@open-wa/schema';
import '@open-wa/schema';
import { createScreencastRoute, ScreencastManager } from '@open-wa/screencaster/server';
import { createApiMiddleware } from './createApiMiddleware';
import { registerMetaRoutes } from './routes/meta';
import { registerDebugRoutes } from './routes/debug';
import { SocketManager } from './socket/SocketManager';
import { ElasticEmitter } from './monitoring/elastic';
import { setupViteDevServer, mountDashboardProduction } from './dashboard/middleware';
import type { ApiServerOptions, ClientMethodMap } from './types';
import type { IScreencastPage } from '@open-wa/screencaster/server';
import type { PluginHost } from '@open-wa/core';

function parseCorsOrigin(corsConfig: string | string[]): string | string[] {
  if (corsConfig === '*') {
    return '*';
  }

  if (Array.isArray(corsConfig)) {
    return corsConfig;
  }

  if (typeof corsConfig === 'string' && corsConfig.includes(',')) {
    return corsConfig.split(',').map((origin) => origin.trim());
  }

  return corsConfig;
}

export class ApiServer {
  private app: Hono;
  private io?: SocketIOServer;
  private config: Config;
  private socketManager?: SocketManager;
  private client: ClientMethodMap | undefined;
  private elasticEmitter?: ElasticEmitter;
  private latestQR: string | null = null;
  private screencastManager: ScreencastManager;
  private injectWebSocket: ((server: unknown) => void) | null = null;
  private isDashboardActive: boolean = false;
  private pluginHost?: PluginHost;
  private readinessProvider?: () => {
    state?: string;
    status?: string;
    ready: boolean;
    exposureSafe?: boolean;
    pending?: string[];
    blockers?: string[];
  } | undefined;

  constructor(options: ApiServerOptions) {
    this.config = options.config;
    this.app = new Hono();
    this.screencastManager = new ScreencastManager();

    // Set up WebSocket adapter for Node.js
    const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: this.app });
    this.injectWebSocket = injectWebSocket as (server: unknown) => void;

    if (this.config.elasticUrl) {
      this.elasticEmitter = new ElasticEmitter({
        url: this.config.elasticUrl,
        username: this.config.elasticUsername,
        password: this.config.elasticPassword,
        bufferSize: this.config.elasticBufferSize,
        pipeline: this.config.elasticPipeline,
        indexPrefix: this.config.elasticIndexPrefix,
      });
    }

    this.setupMiddleware();
    this.registerRoutes();

    // Register screencast WebSocket route
    this.app.get('/screencast', createScreencastRoute(upgradeWebSocket, this.screencastManager));
  }

  public setClient(client: ClientMethodMap | undefined) {
    this.client = client;
    this.socketManager?.setClient(client);
  }

  public setReadinessProvider(
    provider: (() => {
      state?: string;
      status?: string;
      ready: boolean;
      exposureSafe?: boolean;
      pending?: string[];
      blockers?: string[];
    } | undefined) | undefined
  ) {
    this.readinessProvider = provider;
  }

  /**
   * Bind a CDP-capable page for screencasting.
   * Call this once the browser page is ready.
   */
  public async setPage(page: IScreencastPage): Promise<void> {
    await this.screencastManager.setPage(page);
  }

  /**
   * Unbind the screencaster page (session ended).
   */
  public async clearPage(): Promise<void> {
    await this.screencastManager.clearPage();
  }

  public setQR(qr: string) {
    this.latestQR = qr;
  }

  public getApp() {
    return this.app;
  }

  public getIO() {
    return this.io;
  }

  /**
   * Mount plugin routes and manifest endpoint.
   * Call this after the PluginHost has all plugins registered.
   */
  public mountPlugins(pluginHost: PluginHost): void {
    this.pluginHost = pluginHost;

    // Mount each plugin's routes at /plugins/<name>/
    for (const { name, router } of pluginHost.getRoutes()) {
      this.app.route(`/plugins/${name}`, router);
    }

    // Serve the manifest for the dashboard to discover plugin pages
    this.app.get('/plugins/manifest', (c) => c.json(pluginHost.getManifest()));
  }

  public async start() {
    let viteDevServer: any = null;
    if (this.config.dashboard) {
      viteDevServer = await setupViteDevServer();
      if (!viteDevServer) {
        this.isDashboardActive = await mountDashboardProduction(this.app);
      } else {
        this.isDashboardActive = true;
      }
    }

    const honoListener = getRequestListener(this.app.fetch);
    
    const requestListener = (req: any, res: any) => {
      if (viteDevServer && req.url?.startsWith('/dashboard')) {
        viteDevServer.middlewares(req, res, () => {
          honoListener(req, res);
        });
        return;
      }
      honoListener(req, res);
    };

    const server = createServer(requestListener);
    server.listen(this.config.port, this.config.host, () => {
      console.log(`Server running on http://${this.config.host}:${this.config.port}`);
    });

    // Inject WebSocket support into the HTTP server (Node.js adapter)
    if (this.injectWebSocket) {
      this.injectWebSocket(server);
    }

    if (this.config.socketMode) {
      this.io = new SocketIOServer(server, {
        cors: {
          origin: parseCorsOrigin(this.config.cors),
          methods: ['GET', 'POST'],
          credentials: true,
        },
      });

      this.socketManager = new SocketManager(this.io);
      this.socketManager.setClient(this.client);
    }

    if (this.elasticEmitter) {
      await this.elasticEmitter.start();
    }
  }

  public async stop() {
    await this.screencastManager.destroy();
    if (this.elasticEmitter) {
      await this.elasticEmitter.stop();
    }
  }

  public isDashboardRunning() {
    return this.isDashboardActive;
  }

  private isSessionConnected() {
    const readiness = this.readinessProvider?.();
    if (readiness) {
      return readiness.ready;
    }

    if (!this.client) {
      return false;
    }

    return typeof this.client.isConnected === 'function' ? this.client.isConnected() : false;
  }

  private setupMiddleware() {
    this.app.use('/*',
      cors({
        origin: parseCorsOrigin(this.config.cors),
        credentials: true,
      })
    );

    if (this.config.logLevel !== 'silent') {
      this.app.use('*', logger());
    }
  }

  private registerRoutes() {
    const methodDefinitions = getHttpMethodDefinitions();

    this.app.get('/health', (c) =>
      c.json({
        status: 'ok',
        version: '5.0.0',
        socketMode: this.config.socketMode,
        host: {
          available: true,
          api: true,
          dashboard: {
            enabled: this.config.dashboard,
            running: this.isDashboardRunning(),
            port: this.config.dashboardPort,
          },
        },
        connected: this.isSessionConnected(),
        session: this.readinessProvider?.() ?? {
          ready: false,
          status: this.client ? 'legacy' : 'unavailable',
          state: this.client ? 'UNKNOWN' : 'DISCONNECTED',
          pending: this.client ? ['session_readiness_unavailable'] : ['client_not_bound'],
          blockers: [],
          exposureSafe: false,
        },
      })
    );

    this.app.get('/qr', (c) => {
      if (!this.config.ezqr) {
        return c.json({ error: 'QR endpoint disabled' }, 404);
      }

      if (!this.latestQR) {
        return c.json({ error: 'QR code not available', note: 'Session might be connected or generating QR' }, 404);
      }

      return c.json({ qr: this.latestQR, note: 'Scan this QR code in WhatsApp' });
    });

    registerMetaRoutes(this.app, {
      config: this.config,
      methodDefinitions,
    });

    registerDebugRoutes(this.app, {
      config: this.config,
      getConfig: () => this.config,
      setIntegration: (id, data) => {
        if (!this.config.integrations) {
          this.config.integrations = {};
        }
        this.config.integrations[id] = data;
      },
    });

    this.app.route(
      '/api',
      createApiMiddleware(() => this.client, {
        config: this.config,
        basePath: '/api',
        methodDefinitions,
        elasticEmitter: this.elasticEmitter,
        isSessionConnected: () => this.isSessionConnected(),
      })
    );
  }
}

export function createApiServer(config: Config) {
  return new ApiServer({ config });
}
