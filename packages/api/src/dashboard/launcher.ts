/**
 * Dashboard Launcher
 *
 * Launches the dashboard-neo TanStack Start app as a sidecar process.
 * The dashboard communicates with the Easy API via @open-wa/socket-client.
 *
 * Dashboard is started by default (config.dashboard = true).
 * Disable with --no-dashboard or dashboard: false in config.
 */
import { spawn, type ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';

let dashboardProcess: ChildProcess | null = null;

/**
 * Find the dashboard-neo package directory.
 * Looks in the monorepo structure relative to this file,
 * or checks node_modules for the installed package.
 */
function findDashboardDir(): string | null {
  const monorepoCandidates = [
    // Bundled runtime: packages/api/dist -> apps/dashboard-neo
    resolve(__dirname, '../../../apps/dashboard-neo'),
    // Source runtime: packages/api/src/dashboard -> apps/dashboard-neo
    resolve(__dirname, '../../../../apps/dashboard-neo'),
  ];

  const monorepoPath = monorepoCandidates.find((candidate) => existsSync(resolve(candidate, 'package.json')));
  if (monorepoPath) {
    return monorepoPath;
  }

  // Installed as dependency
  try {
    const pkgPath = require.resolve('@open-wa/dashboard-neo/package.json');
    return dirname(pkgPath);
  } catch {
    // Not installed
  }

  return null;
}

export interface DashboardOptions {
  port: number;
  apiPort: number;
  apiHost: string;
  onReady?: (url: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Launch the dashboard sidecar process.
 */
export function launchDashboard(options: DashboardOptions): ChildProcess | null {
  const dashboardDir = findDashboardDir();

  if (!dashboardDir) {
    console.warn('[dashboard] Dashboard package not found. Skipping launch.');
    return null;
  }

  // Check if already built
  const hasBuilt = existsSync(resolve(dashboardDir, '.output')) || existsSync(resolve(dashboardDir, 'dist'));

  const args = hasBuilt
    ? ['run', 'preview', '--', '--port', String(options.port)]
    : ['run', 'dev', '--port', String(options.port)];

  const env = {
    ...process.env,
    PORT: String(options.port),
    OWA_API_URL: `http://${options.apiHost}:${options.apiPort}`,
  };

  dashboardProcess = spawn('pnpm', args, {
    cwd: dashboardDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const url = `http://localhost:${options.port}`;

  dashboardProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString();
    if (output.includes('Local:') || output.includes('ready') || output.includes('listening')) {
      options.onReady?.(url);
    }
  });

  dashboardProcess.stderr?.on('data', (data: Buffer) => {
    const output = data.toString();
    // Filter out common non-error output from Vite
    if (!output.includes('VITE') && !output.includes('warn')) {
      console.error(`[dashboard] ${output.trim()}`);
    }
  });

  dashboardProcess.on('error', (error) => {
    console.error('[dashboard] Failed to start:', error.message);
    options.onError?.(error);
  });

  dashboardProcess.on('exit', (code) => {
    if (code && code !== 0) {
      console.warn(`[dashboard] Process exited with code ${code}`);
    }
    dashboardProcess = null;
  });

  return dashboardProcess;
}

/**
 * Stop the dashboard sidecar.
 */
export function stopDashboard(): void {
  if (dashboardProcess) {
    dashboardProcess.kill('SIGTERM');
    dashboardProcess = null;
  }
}

/**
 * Check if dashboard is currently running.
 */
export function isDashboardRunning(): boolean {
  return dashboardProcess !== null && !dashboardProcess.killed;
}
