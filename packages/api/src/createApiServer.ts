import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getRequestListener } from '@hono/node-server';
import { createServer } from 'http';
import { createNodeWebSocket } from '@hono/node-ws';
import { getHttpMethodDefinitions, type Config } from '@open-wa/schema';
import '@open-wa/schema';
import { createScreencastRoute, ScreencastManager } from '@open-wa/screencaster/server';
import { createApiMiddleware } from './createApiMiddleware';
import { createHonoMcpAdapter } from '@open-wa/mcp';
import { registerMetaRoutes } from './routes/meta';
import { registerDebugRoutes } from './routes/debug';
import { registerAgentDiscoveryRoutes } from './routes/agent-discovery';
import { type EventBridge } from './events/EventBridge';
import { HealthStore } from './health/HealthStore';
import { EventBroadcaster } from './events/EventBroadcaster';
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
  private config: Config;
  private client: ClientMethodMap | undefined;
  private elasticEmitter?: ElasticEmitter;
  private latestQR: string | null = null;
  private screencastManager: ScreencastManager;
  private injectWebSocket: ((server: unknown) => void) | null = null;
  private isDashboardActive: boolean = false;
  private pluginHost?: PluginHost;
  private healthStore: HealthStore = new HealthStore();
  private eventBroadcaster: EventBroadcaster;
  private eventBridge?: EventBridge;
  private eventBridgeListener?: (event: string, payload: any) => void;
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

    // Validate MCP configuration
    if (this.config.mcp?.enabled && !this.config.apiKey) {
      throw new Error(
        'MCP requires Easy API apiKey. Refusing to start with MCP enabled and no apiKey configured.'
      );
    }

    this.app = new Hono();
    this.screencastManager = new ScreencastManager();
    this.eventBroadcaster = new EventBroadcaster(this.config.sessionId);

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
  }

  public setEventBridge(bridge: EventBridge) {
    if (this.eventBridge && this.eventBridgeListener) {
      this.eventBridge.offAny(this.eventBridgeListener);
    }

    this.eventBridge = bridge;
    this.eventBridgeListener = (event: string, payload: any) => {
      this.healthStore.processEvent(event, payload);
      this.eventBroadcaster.broadcast(event, payload);
    };

    // Also wire events into the HealthStore so /health returns accumulated data
    bridge.onAny(this.eventBridgeListener);
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

  public getEventBroadcaster() {
    return this.eventBroadcaster;
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

    if (this.injectWebSocket) {
      let honoUpgradeListener: Function | null = null;
      this.injectWebSocket({
        on: (event: string, listener: Function) => {
          if (event === 'upgrade') honoUpgradeListener = listener;
        }
      });
      if (honoUpgradeListener) {
        server.on('upgrade', (req, socket, head) => {
          honoUpgradeListener!(req, socket, head);
        });
      }
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

    this.app.use('/*', async (c, next) => {
      const path = new URL(c.req.url).pathname;
      if (path === '/' || path.startsWith('/dashboard')) {
        c.header('Link', [
          `</.well-known/api-catalog>; rel="api-catalog"`,
          `</.well-known/mcp/server-card.json>; rel="mcp"`,
          `</.well-known/agent-card.json>; rel="describedby"`
        ].join(', '));
      }

      if (path === '/' && (c.req.header('Accept') || '').includes('text/markdown')) {
        const origin = new URL(c.req.url).origin;
        c.header('Content-Type', 'text/markdown');
        return c.text(`# Open-WA Easy API\n\nThis is an Agent-Native API endpoint.\n\n## API Catalog\nExplore endpoints at \`${origin}/.well-known/api-catalog\` and docs at \`${origin}/api-docs\`.\n\n## MCP Endpoint\nAn MCP server is running for agents at \`${origin}/mcp\`.\n`);
      }
      await next();
    });

    if (this.config.logLevel !== 'silent') {
      this.app.use('*', logger());
    }
  }

  private registerRoutes() {
    const methodDefinitions = getHttpMethodDefinitions();
    registerAgentDiscoveryRoutes(this.app, { config: this.config, methodDefinitions });

    this.app.get('/health', (c) => {
      const healthSnapshot = this.healthStore.getSnapshot();
      return c.json({
        status: 'ok',
        version: '5.0.0',
        host: {
          available: true,
          api: true,
          dashboard: {
            enabled: this.config.dashboard,
            running: this.isDashboardRunning(),
            port: this.config.dashboardPort,
          },
          mcp: {
            enabled: Boolean(this.config.mcp?.enabled),
            available: Boolean(this.config.apiKey && this.config.mcp?.enabled),
            path: this.config.mcp?.path || '/mcp',
          },
        },
        capabilities: {
          apiKeyConfigured: Boolean(this.config.apiKey),
          mcpEnabled: Boolean(this.config.mcp?.enabled),
          mcpAvailable: Boolean(this.config.apiKey && this.config.mcp?.enabled),
          mcpPath: this.config.mcp?.path || '/mcp',
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
        // QR code for pre-launch scanning
        qr: this.latestQR ?? null,
        // Accumulated health data for the dashboard
        launchTimeline: healthSnapshot.launchTimeline,
        patches: healthSnapshot.patches,
        license: healthSnapshot.license,
        reconnections: healthSnapshot.reconnections,
        startedAt: healthSnapshot.startedAt,
        lastEventAt: healthSnapshot.lastEventAt,
      });
    });

    this.app.get('/qr', (c) => {
      if (!this.config.ezqr) {
        return c.json({ error: 'QR endpoint disabled' }, 404);
      }

      if (!this.latestQR) {
        return c.json({ error: 'QR code not available', note: 'Session might be connected or generating QR' }, 404);
      }

      return c.json({ qr: this.latestQR, note: 'Scan this QR code in WhatsApp' });
    });

    this.app.get('/api/events', (c) => {
      // TODO: Unify this inline auth check with the shared apiKeyMiddleware used across Easy API.
      // Note: This intentionally supports query params to preserve legacy Easy API behavior,
      // unlike the MCP adapter which strictly enforces header-only auth (X-API-Key) for security.
      if (this.config.apiKey) {
        const apiKey = c.req.header('X-API-Key') || c.req.query('api_key') || c.req.query('key');

        if (!apiKey || apiKey !== this.config.apiKey) {
          return c.json({ error: 'Unauthorized', details: 'Invalid or missing API key' }, 401);
        }
      }

      const topicsParam = c.req.query('topics');
      const topics = topicsParam
        ? topicsParam
          .split(',')
          .map((topic) => topic.trim())
          .filter(Boolean)
        : ['*'];

      return new Response(
        this.eventBroadcaster.createStream({
          signal: c.req.raw.signal,
          topics,
        }),
        {
          headers: {
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'Content-Type': 'text/event-stream',
            'X-Accel-Buffering': 'no',
          },
        }
      );
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
        elasticEmitter: this.elasticEmitter,
        isSessionConnected: () => this.isSessionConnected(),
      })
    );

    if (this.config.mcp?.enabled) {
      const mcpAdapter = createHonoMcpAdapter({
        config: this.config,
        clientSource: () => this.client,
        elasticEmitter: this.elasticEmitter,
        basePath: '/api',
        isSessionConnected: () => this.isSessionConnected(),
      });
      mcpAdapter.mount(this.app, this.config.mcp.path || '/mcp');
    }
  }
}

export function createApiServer(config: Config) {
  return new ApiServer({ config });
}
