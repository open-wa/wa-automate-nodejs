import { tunnel } from 'cloudflared';
import type { Logger } from '@open-wa/logger';
import type { CloudflareConfig } from './config.js';

export interface TunnelResult {
  url: string;
  stop: () => Promise<void>;
}

interface ChildProcess {
  stdout?: { on: (event: string, cb: (data: Buffer) => void) => void; once: (event: string, cb: (data: Buffer) => void) => void };
  stderr?: { on: (event: string, cb: (data: Buffer) => void) => void; once: (event: string, cb: (data: Buffer) => void) => void };
  on: (event: string, cb: (codeOrError: number | Error) => void) => void;
}

interface TunnelOutput {
  connections: Promise<unknown>[];
  child: ChildProcess;
  stop: () => void;
}

function childProcessToPromise(child: ChildProcess, logger: Logger): Promise<boolean> {
  return new Promise((resolve, reject) => {
    child.stdout?.on('data', (data: Buffer) => logger.info(`CLOUDFLARE: ${data.toString()}`));
    child.stderr?.on('data', (data: Buffer) => logger.info(`CLOUDFLARE: ${data.toString()}`));
    child.on('error', reject);
    child.on('exit', (codeOrError: number | Error) => {
      if (typeof codeOrError === 'number' && codeOrError === 0) {
        resolve(true);
      } else {
        reject(new Error(`Exit code: ${codeOrError}`));
      }
    });
  });
}

export async function createTunnel(
  config: CloudflareConfig,
  sessionId: string,
  logger: Logger
): Promise<TunnelResult> {
  const sessionName = sessionId.replace(/[^A-Z0-9]/gi, '_').toLowerCase();
  const tunnelName = `_owa_${sessionName}`;
  const namespacePrefix = config.namespace ? `.${config.namespace}` : '_owa';
  const fqdn = `${sessionName}${namespacePrefix}.${config.hostDomain}`;
  const hostname = `https://${fqdn}`;
  const target = `http://localhost:${config.port}`;

  logger.info(`Checking if tunnel ${tunnelName} exists...`);

  const tunnelExists = await new Promise<boolean>((resolve) => {
    const check = (data: Buffer) => {
      logger.info(data.toString());
      resolve(!data.toString().includes('error'));
    };
    const { child } = tunnel({ info: tunnelName }) as { child: ChildProcess };
    child.stdout?.once('data', check);
    child.stderr?.once('data', check);
  });

  if (!tunnelExists) {
    logger.info('Tunnel does not exist, creating...');
    const { child } = tunnel({ create: tunnelName }) as { child: ChildProcess };
    await childProcessToPromise(child, logger);
  }

  logger.info(`Routing traffic to tunnel via ${fqdn}...`);
  const routeResult = tunnel({ route: 'dns', '--overwrite-dns': null, [tunnelName]: fqdn }) as { child: ChildProcess };
  await childProcessToPromise(routeResult.child, logger);

  const { connections, child, stop } = tunnel({
    '--url': target,
    '--hostname': hostname,
    run: tunnelName,
  }) as TunnelOutput;

  child.stdout?.on('data', (data: Buffer) => logger.info(`CLOUDFLARE: ${data.toString()}`));

  const conns = await Promise.all(connections);
  logger.info(`Connections Ready! ${JSON.stringify(conns, null, 2)}`);

  return {
    url: hostname,
    stop: async () => {
      stop();
      const { child: deleteChild } = tunnel({ delete: tunnelName }) as { child: ChildProcess };
      await childProcessToPromise(deleteChild, logger);
    },
  };
}
