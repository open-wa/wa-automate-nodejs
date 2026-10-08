/**
 * Debug routes for the dashboard.
 *
 * Provides memory metrics, runtime config dump, and integration config CRUD.
 * These are consumed by the dashboard-neo debug and integrations pages.
 */
import type { Config } from '@open-wa/schema';
import type { BrowserConsoleStore } from '../diagnostics/BrowserConsoleStore';

export function registerDebugRoutes(
  app: any,
  options: {
    config: Config;
    getConfig: () => Config;
    getDiagnostics: () => {
      available: boolean;
      captureSource: 'session event bridge';
      captureLimit: number;
      records: unknown[];
    };
    getBrowserConsole: () => ReturnType<BrowserConsoleStore['getSnapshot']>;
    getEventStreamCount: () => number;
    setIntegration?: (id: string, data: { enabled: boolean; config: Record<string, string> }) => void;
  }
) {
  // Browser diagnostics use the same configured key as the rest of Easy API.
  app.use('/meta/debug/browser-console/*', async (c: any, next: () => Promise<void>) => {
    if (options.config.apiKey && c.req.header('X-API-Key') !== options.config.apiKey) {
      return c.json({ error: 'Unauthorized', details: 'Invalid or missing API key' }, 401);
    }
    await next();
  });
  app.get('/meta/debug/browser-console/history', (c: any) => c.json(options.getBrowserConsole()));

  // Error records can contain runtime details, so require the configured Easy API key.
  app.get('/meta/debug/diagnostics', (c: any) => {
    const apiKey = options.config.apiKey;
    if (!apiKey || c.req.header('X-API-Key') !== apiKey) {
      return c.json({ error: 'Unauthorized', details: 'Invalid or missing API key' }, 401);
    }
    return c.json(options.getDiagnostics());
  });

  // ─── Memory Metrics ──────────────────────────────────────────────
  app.get('/meta/debug/memory', (c: any) => {
    const mem = process.memoryUsage();
    return c.json({
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      timestamp: Date.now(),
    });
  });

  // ─── Runtime Config (redacted) ───────────────────────────────────
  app.get('/meta/debug/config', (c: any) => {
    const config = options.getConfig();
    // Redact sensitive fields
    const redacted = { ...config } as Record<string, unknown>;
    const sensitiveKeys = ['apiKey', 'licenseKey', 'elasticPassword', 'elasticUsername', 'sessionData', 'sessionDataBucketAuth',
      'sessionDataEncryptionKey', 'sessionDataEncryptionKeyFile'];
    for (const key of sensitiveKeys) {
      if (redacted[key]) {
        redacted[key] = '***REDACTED***';
      }
    }
    // Redact nested secrets
    if (redacted.proxyServerCredentials) {
      redacted.proxyServerCredentials = { ...redacted.proxyServerCredentials as Record<string, unknown>, password: '***REDACTED***' };
    }
    if (redacted.s3Sync) {
      redacted.s3Sync = { ...redacted.s3Sync as Record<string, unknown>, accessKeyId: '***REDACTED***', secretAccessKey: '***REDACTED***', sessionToken: '***REDACTED***', headers: '***REDACTED***' };
    }
    return c.json(redacted);
  });

  // ─── Process Info ────────────────────────────────────────────────
  app.get('/meta/debug/info', (c: any) => {
    return c.json({
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime(),
      eventStreams: options.getEventStreamCount(),
      cwd: process.cwd(),
    });
  });

  // ─── Integrations CRUD ──────────────────────────────────────────
  app.get('/meta/integrations', (c: any) => {
    const config = options.getConfig();
    return c.json(config.integrations || {});
  });

  app.put('/meta/integrations/:id', async (c: any) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { enabled, config: integConfig } = body as {
      enabled: boolean;
      config: Record<string, string>;
    };

    if (options.setIntegration) {
      options.setIntegration(id, { enabled, config: integConfig });
      return c.json({ success: true, message: `Integration '${id}' updated. Restart session to apply changes.` });
    }

    return c.json({ success: false, message: 'Integration management not available' }, 501);
  });

  app.patch('/meta/integrations/:id', async (c: any) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { enabled } = body as { enabled: boolean };

    if (options.setIntegration) {
      const config = options.getConfig();
      const existing = config.integrations?.[id] || { enabled: false, config: {} };
      options.setIntegration(id, { ...existing, enabled });
      return c.json({ success: true, message: `Integration '${id}' ${enabled ? 'enabled' : 'disabled'}. Restart session to apply.` });
    }

    return c.json({ success: false, message: 'Integration management not available' }, 501);
  });
}
