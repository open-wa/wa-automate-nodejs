import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { OpenWAEventMap } from '../events/eventMap.js';
import type { Plugin, Hooks, PluginInput, ToolDefinition } from './types.js';

interface PluginEntry {
  hooks: Hooks;
  name: string;
}

const HOOK_EVENTS = [
  'core.starting', 'core.started', 'core.stopping',
  'auth.qr', 'auth.authenticated',
  'client.ready',
  'message.received', 'message.sent', 'message.ack'
] as const;

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
    for (const event of HOOK_EVENTS) {
      const handler = hooks[event];
      if (handler) {
        this.events.on(event as keyof OpenWAEventMap, async (payload: unknown) => {
          try {
            await (handler as (payload: unknown) => Promise<void>)(payload);
          } catch (err) {
            this.logger.error('plugin_hook_error', { plugin: name, event, error: err });
          }
        });
      }
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
