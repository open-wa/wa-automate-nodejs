import type { Plugin, PluginInput, Hooks } from '@open-wa/core';
import type { CloudflareConfig } from './config.js';
import { createTunnel, type TunnelResult } from './tunnel.js';

export function cloudflarePlugin(config: CloudflareConfig): Plugin {
  return async (input: PluginInput): Promise<Hooks> => {
    const { logger, sessionId } = input;
    let tunnel: TunnelResult | null = null;

    return {
      'core.started': async () => {
        logger.info('Starting Cloudflare tunnel...');
        tunnel = await createTunnel(config, sessionId, logger);
        logger.info(`Tunnel ready: ${tunnel.url}`);
      },

      dispose: async () => {
        if (tunnel) {
          await tunnel.stop();
          logger.info('Cloudflare tunnel stopped');
        }
      },
    };
  };
}
