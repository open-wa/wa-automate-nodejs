import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HyperEmitter } from '@open-wa/hyperemitter';
import { createLogger } from '@open-wa/logger';
import { PluginHost } from '../../src/plugins/PluginHost.js';
import type { Plugin, PluginInput, Hooks } from '../../src/plugins/types.js';
import type { OpenWAEventMap } from '../../src/events/eventMap.js';

function createTestEvents(): HyperEmitter<OpenWAEventMap> {
  return new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true });
}

function createTestLogger() {
  return createLogger({ component: 'test' });
}

function createTestInput(events: HyperEmitter<OpenWAEventMap>): PluginInput {
  return {
    events,
    logger: createTestLogger(),
    config: {},
    sessionId: 'test-session',
  };
}

describe('PluginHost', () => {
  let events: HyperEmitter<OpenWAEventMap>;
  let host: PluginHost;
  let input: PluginInput;

  beforeEach(() => {
    events = createTestEvents();
    host = new PluginHost(events, createTestLogger());
    input = createTestInput(events);
  });

  describe('register', () => {
    it('registers a plugin and tracks it by name', async () => {
      const plugin: Plugin = async () => ({});
      await host.register('test-plugin', plugin, input);
      
      expect(host.hasPlugin('test-plugin')).toBe(true);
      expect(host.getPluginNames()).toContain('test-plugin');
    });

    it('throws when registering duplicate plugin names', async () => {
      const plugin: Plugin = async () => ({});
      await host.register('dupe', plugin, input);
      
      await expect(host.register('dupe', plugin, input)).rejects.toThrow('Plugin dupe already registered');
    });

    it('invokes plugin factory with input and stores returned hooks', async () => {
      const factory = vi.fn().mockResolvedValue({ dispose: vi.fn() });
      await host.register('factory-test', factory, input);
      
      expect(factory).toHaveBeenCalledWith(input);
    });
  });

  describe('wireHooks - specific hooks', () => {
    it('wires core.starting hook to core.starting event', async () => {
      const startingHandler = vi.fn();
      const plugin: Plugin = async () => ({ 'core.starting': startingHandler });
      await host.register('lifecycle', plugin, input);
      
      events.emit('core.starting', { config: {} });
      
      await vi.waitFor(() => expect(startingHandler).toHaveBeenCalledTimes(1));
    });

    it('wires auth.qr hook to launch.auth.qr.generated event', async () => {
      const qrHandler = vi.fn();
      const plugin: Plugin = async () => ({ 'auth.qr': qrHandler });
      await host.register('qr-plugin', plugin, input);
      
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
      const plugin: Plugin = async () => ({ 'client.ready': readyHandler });
      await host.register('ready-plugin', plugin, input);
      
      events.emit('client.ready', { sessionId: 'test-session' });
      
      await vi.waitFor(() => expect(readyHandler).toHaveBeenCalledWith({ sessionId: 'test-session' }));
    });
  });

  describe('wireHooks - catch-all event handler', () => {
    it('forwards all catchable events to event hook with event name', async () => {
      const receivedEvents: { event: string; payload: unknown }[] = [];
      const plugin: Plugin = async () => ({
        event: async ({ event, payload }) => {
          receivedEvents.push({ event, payload });
        },
      });
      await host.register('catchall', plugin, input);
      
      events.emit('message.received', { ctx: { correlationId: 'c1', ts: Date.now() }, message: { id: 'm1' } });
      events.emit('core.started', {});
      
      await vi.waitFor(() => expect(receivedEvents.length).toBe(2));
      expect(receivedEvents.some(e => e.event === 'message.received')).toBe(true);
      expect(receivedEvents.some(e => e.event === 'core.started')).toBe(true);
    });

    it('does not forward internal-only events not in CATCHABLE_EVENTS', async () => {
      const receivedEvents: string[] = [];
      const plugin: Plugin = async () => ({
        event: async ({ event }) => { receivedEvents.push(event); },
      });
      await host.register('internal-filter', plugin, input);
      
      events.emit('launch.browser.init.before', { correlationId: 'x', ts: Date.now(), step: 'browser' });
      
      await new Promise(r => setTimeout(r, 50));
      expect(receivedEvents).not.toContain('launch.browser.init.before');
    });
  });

  describe('dispose', () => {
    it('calls dispose hook on all registered plugins', async () => {
      const dispose1 = vi.fn();
      const dispose2 = vi.fn();
      
      await host.register('p1', async () => ({ dispose: dispose1 }), input);
      await host.register('p2', async () => ({ dispose: dispose2 }), input);
      
      await host.dispose();
      
      expect(dispose1).toHaveBeenCalledTimes(1);
      expect(dispose2).toHaveBeenCalledTimes(1);
    });

    it('clears all plugins after dispose', async () => {
      await host.register('p1', async () => ({}), input);
      await host.dispose();
      
      expect(host.getPluginNames()).toHaveLength(0);
    });

    it('continues disposing other plugins if one throws', async () => {
      const dispose2 = vi.fn();
      await host.register('throws', async () => ({ dispose: () => { throw new Error('fail'); } }), input);
      await host.register('works', async () => ({ dispose: dispose2 }), input);
      
      await host.dispose();
      
      expect(dispose2).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTools', () => {
    it('collects tools from all plugins with namespaced keys', async () => {
      const plugin: Plugin = async () => ({
        tool: {
          sendMessage: {
            description: 'Send a message',
            args: {},
            execute: async () => 'sent',
          },
        },
      });
      await host.register('messaging', plugin, input);
      
      const tools = host.getTools();
      
      expect(tools['messaging.sendMessage']).toBeDefined();
      expect(tools['messaging.sendMessage'].plugin).toBe('messaging');
      expect(tools['messaging.sendMessage'].tool.description).toBe('Send a message');
    });
  });
});
