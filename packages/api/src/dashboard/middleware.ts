import { resolve, dirname } from 'path';
import { existsSync, readFileSync } from 'fs';
import type { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
export function findDashboardDir(): string | null {
  const monorepoCandidates = [
    resolve(__dirname, '../../../apps/dashboard-neo'),
    resolve(__dirname, '../../../../apps/dashboard-neo'),
  ];

  const monorepoPath = monorepoCandidates.find((candidate) => existsSync(resolve(candidate, 'package.json')));
  if (monorepoPath) {
    return monorepoPath;
  }

  try {
    const pkgPath = require.resolve('@open-wa/dashboard-neo/package.json');
    return dirname(pkgPath);
  } catch {
    // Not installed
  }

  return null;
}


export async function setupViteDevServer(): Promise<any | null> {
  const dashboardDir = findDashboardDir();
  if (!dashboardDir) return null;

  const isProd = process.env.NODE_ENV === 'production' || !existsSync(resolve(dashboardDir, 'vite.config.ts'));
  if (isProd) return null;

  try {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      root: dashboardDir,
      server: { middlewareMode: true },
      appType: 'spa',
      base: '/dashboard/',
    });
    console.log(`\n🚀 Dashboard mounted at /dashboard/ (Vite dev middleware)\n`);
    return viteServer;
  } catch (e: any) {
    console.warn(`[dashboard] Failed to mount Vite middleware: ${e.message}`);
    return null;
  }
}

export async function mountDashboardProduction(app: Hono): Promise<boolean> {
  const dashboardDir = findDashboardDir();
  if (!dashboardDir) return false;
  const distPath = resolve(dashboardDir, 'dist');
  if (existsSync(distPath)) {
    // Determine the root for serveStatic relative to process.cwd, or just use absolute?
    // serveStatic usually looks at relative paths from process.cwd() unless configured.
    // wait, @hono/node-server/serve-static `root` defaults to "./".
    // It's safer to use a custom middleware to read the files, or pass absolute path directly if supported.
    app.use('/dashboard/*', serveStatic({ 
        root: distPath, 
        rewriteRequestPath: (path) => path.replace(/^\/dashboard/, '')
    }));

    // Fallback for SPA
    app.get('/dashboard/*', (c) => {
      const indexPath = resolve(distPath, 'index.html');
      if (existsSync(indexPath)) {
        return c.html(readFileSync(indexPath, 'utf-8'));
      }
      return c.notFound();
    });

    console.log(`\n🚀 Dashboard mounted at /dashboard/ (Production static)\n`);
    return true;
  }

  return false;
}
