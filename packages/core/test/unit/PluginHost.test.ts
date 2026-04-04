import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HyperEmitter } from '@open-wa/hyperemitter';
import { createLogger } from '@open-wa/logger';
import { PluginHost } from '../../src/plugins/PluginHost.js';
import { createPlugin } from '@open-wa/plugin-sdk';
import type { PluginClient, PluginInput } from '../../src/plugins/types.js';
import type { OpenWAEventMap } from '../../src/events/eventMap.js';

function createTestEvents(): HyperEmitter<OpenWAEventMap> {
  return new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true });
}

function createTestLogger() {
  return createLogger({ component: 'test' });
}

function createTestClient(): PluginClient {
  const fn = vi.fn(async () => undefined);
  return {
    ask: fn,
    listen: vi.fn(async () => 'listener-id'),
    sendText: vi.fn(async () => 'message-id'),
    sendImage: vi.fn(async () => 'message-id'),
    sendFile: vi.fn(async () => 'message-id'),
    sendLocation: vi.fn(async () => 'message-id'),
    sendLinkWithAutoPreview: vi.fn(async () => 'message-id'),
    reply: vi.fn(async () => 'message-id'),
    decryptMedia: vi.fn(async () => 'media'),
    getHostNumber: vi.fn(async () => '123'),
    getContact: vi.fn(async () => ({})),
    getAllContacts: vi.fn(async () => []),
    getAllChats: vi.fn(async () => []),
    sendSeen: vi.fn(async () => true),
  };
}

function createRegisterOptions(): Pick<PluginInput, 'sessionId' | 'client'> & { pluginConfig?: Record<string, unknown> } {
  return {
    sessionId: 'test-session',
    client: createTestClient(),
  };
}

function createTestPlugin(
  name: string,
  init: (input: PluginInput) => Promise<Record<string, unknown>> | Record<string, unknown>
) {
  return createPlugin({
    meta: { name, version: '1.0.0' },
    init: async (input) => init(input),
  });
}

describe('PluginHost', () => {
  let events: HyperEmitter<OpenWAEventMap>;
  let host: PluginHost;
  let registerOptions: ReturnType<typeof createRegisterOptions>;

  beforeEach(() => {
    events = createTestEvents();
    host = new PluginHost(events, createTestLogger());
    registerOptions = createRegisterOptions();
  });

  describe('register', () => {
    it('registers a plugin and tracks it by name', async () => {
      const plugin = createTestPlugin('test-plugin', async () => ({}));
      await host.register(plugin, registerOptions);
      
      expect(host.hasPlugin('test-plugin')).toBe(true);
      expect(host.getPluginNames()).toContain('test-plugin');
    });

    it('throws when registering duplicate plugin names', async () => {
      const plugin = createTestPlugin('dupe', async () => ({}));
      await host.register(plugin, registerOptions);
      
      await expect(host.register(plugin, registerOptions)).rejects.toThrow('Plugin "dupe" is already registered');
    });

    it('invokes plugin factory with input and stores returned hooks', async () => {
      const factory = vi.fn().mockResolvedValue({ dispose: vi.fn() });
      const plugin = createTestPlugin('factory-test', factory);
      await host.register(plugin, registerOptions);
      
      expect(factory).toHaveBeenCalledTimes(1);
      expect(factory).toHaveBeenCalledWith(expect.objectContaining({
        sessionId: 'test-session',
        client: registerOptions.client,
        config: {},
      }));
      expect(factory.mock.calls[0]?.[0].events).toBeDefined();
      expect(factory.mock.calls[0]?.[0].logger).toBeDefined();
    });
  });

  describe('wireHooks - specific hooks', () => {
    it('wires core.starting hook to core.starting event', async () => {
      const startingHandler = vi.fn();
      const plugin = createTestPlugin('lifecycle', async () => ({ 'core.starting': startingHandler }));
      await host.register(plugin, registerOptions);
      
      events.emit('core.starting', { config: {} });
      
      await vi.waitFor(() => expect(startingHandler).toHaveBeenCalledTimes(1));
    });

    it('wires auth.qr hook to launch.auth.qr.generated event', async () => {
      const qrHandler = vi.fn();
      const plugin = createTestPlugin('qr-plugin', async () => ({ 'auth.qr': qrHandler }));
      await host.register(plugin, registerOptions);
      
      const qrPayload = { 
        correlationId: 'test', 
        ts: Date.now(), 
        step: 'qr', 
        qr: 'data:image/png;base64,...', 
        ascii: '...',
        attemptInThisCycle: 1 
      };
      events.emit('launch.auth.qr.generated', qrPayload);
      
      await vi.waitFor(() => expect(qrHandler).toHaveBeenCalledWith(qrPayload));
    });

    it('wires client.ready hook to client.ready event', async () => {
      const readyHandler = vi.fn();
      const plugin = createTestPlugin('ready-plugin', async () => ({ 'client.ready': readyHandler }));
      await host.register(plugin, registerOptions);
      
      events.emit('client.ready', { sessionId: 'test-session' });
      
      await vi.waitFor(() => expect(readyHandler).toHaveBeenCalledWith({ sessionId: 'test-session' }));
    });
  });

  describe('wireHooks - catch-all event handler', () => {
    it('forwards all catchable events to event hook with event name', async () => {
      const receivedEvents: { event: string; payload: unknown }[] = [];
      const plugin = createTestPlugin('catchall', async () => ({
        event: async ({ event, payload }) => {
          receivedEvents.push({ event, payload });
        },
      }));
      await host.register(plugin, registerOptions);
      
      events.emit('message.received', { ctx: { correlationId: 'c1', ts: Date.now() }, message: { id: 'm1' } });
      events.emit('core.started', {});
      
      await vi.waitFor(() => expect(receivedEvents.length).toBe(2));
      expect(receivedEvents.some(e => e.event === 'message.received')).toBe(true);
      expect(receivedEvents.some(e => e.event === 'core.started')).toBe(true);
    });

    it('does not forward internal-only events not in CATCHABLE_EVENTS', async () => {
      const receivedEvents: string[] = [];
      const plugin = createTestPlugin('internal-filter', async () => ({
        event: async ({ event }) => { receivedEvents.push(event); },
      }));
      await host.register(plugin, registerOptions);
      
      events.emit('launch.browser.init.before', { correlationId: 'x', ts: Date.now(), step: 'browser' });
      
      await new Promise(r => setTimeout(r, 50));
      expect(receivedEvents).not.toContain('launch.browser.init.before');
    });
  });

  describe('dispose', () => {
    it('calls dispose hook on all registered plugins', async () => {
      const dispose1 = vi.fn();
      const dispose2 = vi.fn();
      
      await host.register(createTestPlugin('p1', async () => ({ dispose: dispose1 })), registerOptions);
      await host.register(createTestPlugin('p2', async () => ({ dispose: dispose2 })), registerOptions);
      
      await host.dispose();
      
      expect(dispose1).toHaveBeenCalledTimes(1);
      expect(dispose2).toHaveBeenCalledTimes(1);
    });

    it('clears all plugins after dispose', async () => {
      await host.register(createTestPlugin('p1', async () => ({})), registerOptions);
      await host.dispose();
      
      expect(host.getPluginNames()).toHaveLength(0);
    });

    it('continues disposing other plugins if one throws', async () => {
      const dispose2 = vi.fn();
      await host.register(createTestPlugin('throws', async () => ({ dispose: () => { throw new Error('fail'); } })), registerOptions);
      await host.register(createTestPlugin('works', async () => ({ dispose: dispose2 })), registerOptions);
      
      await host.dispose();
      
      expect(dispose2).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTools', () => {
    it('collects tools from all plugins with namespaced keys', async () => {
      const plugin = createTestPlugin('messaging', async () => ({
        tool: {
          sendMessage: {
            description: 'Send a message',
            args: {},
            execute: async () => 'sent',
          },
        },
      }));
      await host.register(plugin, registerOptions);
      
      const tools = host.getTools();
      
      expect(tools['messaging.sendMessage']).toBeDefined();
      expect(tools['messaging.sendMessage'].plugin).toBe('messaging');
      expect(tools['messaging.sendMessage'].tool.description).toBe('Send a message');
    });
  });
});
