export interface CliOptions {
  port: number;
  host: string;
  apiHost?: string;
  sessionId: string;
  webhook?: string;
  apiKey?: string;
  headless: boolean;
  debug: boolean;
  cors: boolean;
  helmet: boolean;
  socket: boolean;
  licenseKey?: string;
  noApi: boolean;
  verbose: boolean;
  tunnel: boolean;
  cfTunnelHostDomain?: string;
  readyWebhook?: string;
  autoReject: boolean;
  onCall?: string;
  emitUnread: boolean;
  noKillOnLogout: boolean;
}

export const defaultOptions: CliOptions = {
  port: 8002,
  host: 'localhost',
  sessionId: 'session',
  headless: true,
  debug: false,
  cors: false,
  helmet: false,
  socket: false,
  noApi: false,
  verbose: false,
  tunnel: false,
  autoReject: false,
  emitUnread: false,
  noKillOnLogout: false,
};

export interface MeowFlags {
  noApi: { type: 'boolean'; alias: string; default: boolean };
  port: { type: 'number'; alias: string; default: number };
  host: { type: 'string'; alias: string; default: string };
  apiHost: { type: 'string' };
  webhook: { type: 'string'; alias: string };
  key: { type: 'string'; alias: string };
  session: { type: 'string'; alias: string };
  headful: { type: 'boolean'; default: boolean };
  debug: { type: 'boolean'; default: boolean };
  verbose: { type: 'boolean'; alias: string; default: boolean };
  cors: { type: 'boolean'; default: boolean };
  helmet: { type: 'boolean'; default: boolean };
  socket: { type: 'boolean'; default: boolean };
  licenseKey: { type: 'string'; alias: string };
  tunnel: { type: 'boolean'; default: boolean };
  cfTunnelHostDomain: { type: 'string' };
  readyWebhook: { type: 'string' };
  autoReject: { type: 'boolean'; default: boolean };
  onCall: { type: 'string' };
  emitUnread: { type: 'boolean'; default: boolean };
  noKillOnLogout: { type: 'boolean'; default: boolean };
}

export const meowFlags: MeowFlags = {
  noApi: { type: 'boolean', alias: 'n', default: false },
  port: { type: 'number', alias: 'p', default: 8002 },
  host: { type: 'string', alias: 'h', default: 'localhost' },
  apiHost: { type: 'string' },
  webhook: { type: 'string', alias: 'w' },
  key: { type: 'string', alias: 'k' },
  session: { type: 'string', alias: 's' },
  headful: { type: 'boolean', default: false },
  debug: { type: 'boolean', default: false },
  verbose: { type: 'boolean', alias: 'v', default: false },
  cors: { type: 'boolean', default: false },
  helmet: { type: 'boolean', default: false },
  socket: { type: 'boolean', default: false },
  licenseKey: { type: 'string', alias: 'l' },
  tunnel: { type: 'boolean', default: false },
  cfTunnelHostDomain: { type: 'string' },
  readyWebhook: { type: 'string' },
  autoReject: { type: 'boolean', default: false },
  onCall: { type: 'string' },
  emitUnread: { type: 'boolean', default: false },
  noKillOnLogout: { type: 'boolean', default: false },
};

export const helpText = `
  Usage
    $ wa [options]
    $ openwa [options]

  Options
    --port, -p        Port for the API server (default: 8002)
    --host, -h        Host to bind (default: localhost)
    --api-host        External API host URL for documentation
    --webhook, -w     Webhook URL for message events
    --key, -k         API key for authentication
    --session, -s     Session ID (default: session)
    --headful         Run browser in headful mode
    --debug           Enable debug logging
    --verbose, -v     Enable verbose console output
    --cors            Enable CORS for all origins
    --helmet          Enable helmet security middleware
    --socket          Expose Socket.IO server
    --license-key, -l License key for premium features
    --tunnel          Expose via Cloudflare tunnel
    --ready-webhook   Webhook to fire when API is ready
    --auto-reject     Auto-reject incoming calls
    --on-call         Message to send when rejecting calls
    --emit-unread     Emit unread messages on startup
    --no-kill-on-logout  Keep process alive on logout
    --no-api, -n      Don't expose API (webhooks only)

  Examples
    $ wa --port 3000 --webhook https://example.com/webhook
    $ wa --headful --debug
    $ wa --session mySession --key secretApiKey
`;

export function parseFlags(flags: Record<string, unknown>): CliOptions {
  return {
    port: (flags.port as number) ?? defaultOptions.port,
    host: (flags.host as string) ?? defaultOptions.host,
    apiHost: flags.apiHost as string | undefined,
    sessionId: (flags.session as string) ?? defaultOptions.sessionId,
    webhook: flags.webhook as string | undefined,
    apiKey: flags.key as string | undefined,
    headless: !(flags.headful as boolean),
    debug: (flags.debug as boolean) ?? defaultOptions.debug,
    cors: (flags.cors as boolean) ?? defaultOptions.cors,
    helmet: (flags.helmet as boolean) ?? defaultOptions.helmet,
    socket: (flags.socket as boolean) ?? defaultOptions.socket,
    licenseKey: flags.licenseKey as string | undefined,
    noApi: (flags.noApi as boolean) ?? defaultOptions.noApi,
    verbose: (flags.verbose as boolean) ?? defaultOptions.verbose,
    tunnel: (flags.tunnel as boolean) ?? defaultOptions.tunnel,
    cfTunnelHostDomain: flags.cfTunnelHostDomain as string | undefined,
    readyWebhook: flags.readyWebhook as string | undefined,
    autoReject: (flags.autoReject as boolean) ?? defaultOptions.autoReject,
    onCall: flags.onCall as string | undefined,
    emitUnread: (flags.emitUnread as boolean) ?? defaultOptions.emitUnread,
    noKillOnLogout: (flags.noKillOnLogout as boolean) ?? defaultOptions.noKillOnLogout,
  };
}
