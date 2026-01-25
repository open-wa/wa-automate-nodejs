import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { OpenWAEventMap } from '../events/eventMap.js';
import type { Plugin, Hooks, PluginInput, ToolDefinition } from './types.js';

interface PluginEntry {
  hooks: Hooks;
  name: string;
}

/** Maps plugin hook names to actual OpenWAEventMap keys (auth.qr → launch.auth.qr.generated) */
const HOOK_EVENT_MAPPING: Record<string, keyof OpenWAEventMap> = {
  'core.starting': 'core.starting',
  'core.started': 'core.started',
  'core.stopping': 'core.stopping',
  'auth.qr': 'launch.auth.qr.generated',
  'auth.authenticated': 'launch.auth.check.after',
  'client.ready': 'client.ready',
  'message.received': 'message.received',
  'message.sent': 'message.any',
  'message.ack': 'ack.changed',
};

const CATCHABLE_EVENTS: (keyof OpenWAEventMap)[] = [
  'core.starting', 'core.started', 'core.stopping', 'core.stopped', 'client.ready',
  'launch.auth.qr.generated', 'launch.auth.check.after',
  'message.received', 'message.any', 'message.deleted',
  'ack.changed',
  'group.addedToGroup', 'group.removedFromGroup', 'group.participants.changed.global',
  'group.approval.request', 'group.changed',
  'chat.deleted', 'chat.opened', 'chat.state',
  'device.battery', 'device.plugged',
  'call.incoming', 'call.state',
  'auth.logout',
  'ui.button', 'ui.poll.vote',
  'broadcast.received', 'label.changed', 'story.received',
  'commerce.order', 'commerce.product.new', 'reaction.added',
  'session.state.changed', 'session.connection.disconnected',
  'session.connection.reconnecting', 'session.connection.reconnected', 'session.logout',
  'error',
];

export class PluginHost {
  private plugins = new Map<string, PluginEntry>();
  private logger: Logger;
  private events: HyperEmitter<OpenWAEventMap>;
  
  constructor(events: HyperEmitter<OpenWAEventMap>, logger: Logger) {
    this.events = events;
    this.logger = logger;
  }
  
  async register(name: string, plugin: Plugin, input: PluginInput): Promise<void> {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} already registered`);
    }
    
    const hooks = await plugin(input);
    this.plugins.set(name, { hooks, name });
    
    this.wireHooks(name, hooks);
    
    this.logger.info('plugin_registered', { plugin: name });
  }
  
  private wireHooks(name: string, hooks: Hooks): void {
    this.wireSpecificHooks(name, hooks);
    this.wireCatchAllHandler(name, hooks);
  }
  
  private wireSpecificHooks(name: string, hooks: Hooks): void {
    for (const [hookName, eventName] of Object.entries(HOOK_EVENT_MAPPING)) {
      const handler = hooks[hookName as keyof Hooks];
      if (handler && typeof handler === 'function') {
        this.events.on(eventName, async (payload: unknown) => {
          try {
            await (handler as (payload: unknown) => Promise<void>)(payload);
          } catch (err) {
            this.logger.error('plugin_hook_error', { plugin: name, event: hookName, error: err });
          }
        });
      }
    }
  }
  
  private wireCatchAllHandler(name: string, hooks: Hooks): void {
    if (!hooks.event) return;
    
    const catchAllHandler = hooks.event;
    for (const eventName of CATCHABLE_EVENTS) {
      this.events.on(eventName, async (payload: unknown) => {
        try {
          await catchAllHandler({ event: eventName, payload });
        } catch (err) {
          this.logger.error('plugin_catchall_error', { plugin: name, event: eventName, error: err });
        }
      });
    }
  }
  
  async dispose(): Promise<void> {
    for (const [name, { hooks }] of this.plugins) {
      if (hooks.dispose) {
        try {
          await hooks.dispose();
        } catch (err) {
          this.logger.error('plugin_dispose_error', { plugin: name, error: err });
        }
      }
    }
    this.plugins.clear();
  }
  
  getTools(): Record<string, { plugin: string; tool: ToolDefinition }> {
    const tools: Record<string, { plugin: string; tool: ToolDefinition }> = {};
    for (const [name, { hooks }] of this.plugins) {
      if (hooks.tool) {
        for (const [toolName, toolDef] of Object.entries(hooks.tool)) {
          tools[`${name}.${toolName}`] = { plugin: name, tool: toolDef };
        }
      }
    }
    return tools;
  }
  
  getPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }
  
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }
}
