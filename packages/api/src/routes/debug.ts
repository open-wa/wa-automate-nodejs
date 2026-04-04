/**
 * Debug routes for the dashboard.
 *
 * Provides memory metrics, runtime config dump, and integration config CRUD.
 * These are consumed by the dashboard-neo debug and integrations pages.
 */
import type { Config } from '@open-wa/schema';

export function registerDebugRoutes(
  app: any,
  options: {
    config: Config;
    getConfig: () => Config;
    setIntegration?: (id: string, data: { enabled: boolean; config: Record<string, string> }) => void;
  }
) {
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
    const sensitiveKeys = ['apiKey', 'licenseKey', 'elasticPassword', 'elasticUsername'];
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
      redacted.s3Sync = { ...redacted.s3Sync as Record<string, unknown>, secretAccessKey: '***REDACTED***' };
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
