#!/usr/bin/env node
import { runCli } from '@open-wa/wa-automate';
import { TunnelClient } from './tunnel-client';

async function main() {
  try {
    const result = await runCli(process.argv.slice(2));
    
    // If pm2 is used, result is void
    if (result && 'config' in result && result.config.proxyHost && result.config.proxyToken) {
      console.log(`[CLI] Starting TunnelClient connecting to ${result.config.proxyHost}...`);
      const tunnelClient = new TunnelClient({
        proxyHost: result.config.proxyHost,
        proxyToken: result.config.proxyToken,
        sessionId: result.config.sessionId,
        localSessionPort: result.config.port,
      });
      tunnelClient.connect();
    }
  } catch (err: unknown) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
