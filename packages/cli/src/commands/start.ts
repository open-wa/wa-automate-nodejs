import type { CliOptions } from '../options.js';
import type { Client } from '@open-wa/client';
import { createClient, Transport } from '@open-wa/core';
import { createLogger } from '@open-wa/logger';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';
import { createServer, type ServerInstance } from '../server/createServer.js';

export interface StartResult {
  client: Client;
  server?: ServerInstance;
}

export async function start(options: CliOptions): Promise<StartResult> {
  const logger = createLogger({ 
    component: 'cli',
    sessionId: options.sessionId,
  });
  
  logger.info('cli_starting', { 
    sessionId: options.sessionId,
    port: options.port,
    headless: options.headless,
  });
  
  const driver = new PuppeteerDriver();
  
  const openwaClient = await createClient({
    sessionId: options.sessionId,
    driver,
    debug: options.debug,
    plugins: [],
  });
  
  const transport = new Transport({
    driver,
    events: openwaClient.events,
    logger: openwaClient.logger,
  });
  
  const { Client: ClientFacade } = await import('@open-wa/client');
  const client = new ClientFacade({
    client: openwaClient,
    transport,
  });
  
  await client.start();
  
  logger.info('client_started', { sessionId: options.sessionId });
  
  let server: ServerInstance | undefined;
  
  if (!options.noApi) {
    server = await createServer({
      client,
      options,
      logger,
    });
    
    await server.start();
    
    logger.info('server_started', { 
      host: options.host, 
      port: options.port,
      url: `http://${options.host}:${options.port}`,
    });
    
    if (options.readyWebhook) {
      try {
        await fetch(options.readyWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'ready',
            sessionId: options.sessionId,
            url: `http://${options.apiHost ?? options.host}:${options.port}`,
          }),
        });
        logger.info('ready_webhook_fired', { url: options.readyWebhook });
      } catch (err) {
        logger.warn('ready_webhook_failed', { url: options.readyWebhook, error: err });
      }
    }
  }
  
  if (options.webhook) {
    client.onMessage(async (message) => {
      try {
        await fetch(options.webhook!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'message',
            sessionId: options.sessionId,
            data: message,
          }),
        });
      } catch (err) {
        logger.warn('webhook_failed', { url: options.webhook, error: err });
      }
    });
    logger.info('webhook_registered', { url: options.webhook });
  }
  
  if (!options.noKillOnLogout) {
    client.onStateChanged((state) => {
      if (state === 'DISCONNECTED' || state === 'STOPPED') {
        logger.info('session_logged_out', { state });
        process.exit(0);
      }
    });
  }
  
  process.on('SIGINT', async () => {
    logger.info('shutdown_signal_received');
    await client.stop('SIGINT');
    if (server) {
      await server.stop();
    }
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.info('shutdown_signal_received');
    await client.stop('SIGTERM');
    if (server) {
      await server.stop();
    }
    process.exit(0);
  });
  
  return { client, server };
}
