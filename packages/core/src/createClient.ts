import { HyperEmitter } from '@open-wa/hyperemitter';
import { createLogger, Logger } from '@open-wa/logger';
import type { IDriver } from '@open-wa/driver-interface';
import { OpenWAEventMap, STATE } from './events/eventMap.js';
import { PluginHost, Plugin, PluginInput } from './plugins/index.js';
import { SessionManager, SessionStore } from './session/index.js';
import { Transport } from './transport/index.js';

export interface CreateClientOptions {
  sessionId?: string;
  driver: IDriver;
  plugins?: Plugin[];
  sessionStore?: SessionStore;
  debug?: boolean;
  waWebUrl?: string;
}

export interface OpenWAClient {
  readonly sessionId: string;
  readonly events: HyperEmitter<OpenWAEventMap>;
  readonly logger: Logger;
  readonly session: SessionManager;
  readonly plugins: PluginHost;
  
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
  getState(): STATE;
}

export async function createClient(options: CreateClientOptions): Promise<OpenWAClient> {
  const sessionId = options.sessionId ?? 'session';
  
  const logger = createLogger({ 
    component: 'core',
    sessionId 
  });
  
  const events = new HyperEmitter<OpenWAEventMap>({
    delimiter: '.',
    captureRejections: true,
    onError: (err) => logger.error('event_error', { error: err }),
    logger,
    debug: options.debug ?? false,
  });
  
  const session = new SessionManager({
    sessionId,
    events,
    logger,
    store: options.sessionStore,
  });
  
  const transport = new Transport({
    driver: options.driver,
    events,
    logger,
    waWebUrl: options.waWebUrl,
  });
  
  const pluginHost = new PluginHost(events, logger);
  
  const pluginInput: PluginInput = {
    events,
    logger,
    config: options,
    sessionId,
  };
  
  if (options.plugins) {
    for (const plugin of options.plugins) {
      const pluginName = plugin.name || `plugin_${pluginHost.getPluginNames().length}`;
      await pluginHost.register(pluginName, plugin, pluginInput);
    }
  }
  
  const client: OpenWAClient = {
    sessionId,
    events,
    logger,
    session,
    plugins: pluginHost,
    
    async start() {
      events.emit('core.starting', { config: options });
      
      await session.setState('STARTING');
      
      await transport.initialize();
      await transport.navigate();
      
      await session.setState('AUTHENTICATING');
      
      await transport.injectWapi();
      
      await session.setState('READY');
      
      events.emit('core.started', {});
      events.emit('client.ready', { sessionId });
      
      logger.info('client_ready', { sessionId });
    },
    
    async stop(reason?: string) {
      events.emit('core.stopping', { reason });
      
      await session.setState('STOPPED', reason);
      await pluginHost.dispose();
      await transport.close();
      
      events.emit('core.stopped', {});
      
      logger.info('client_stopped', { sessionId, reason });
    },
    
    getState() {
      return session.getState();
    }
  };
  
  return client;
}
