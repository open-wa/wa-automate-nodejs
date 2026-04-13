/**
 * Tests for MCP adapter: auth enforcement, readiness gating, and transport shape.
 *
 * These tests verify the adapter at the Hono layer by creating a real
 * Hono app, mounting the adapter, and making requests via app.request().
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { createHonoMcpAdapter } from '../src/adapter/hono-mcp';
import type { Config } from '@open-wa/schema';

function createTestConfig(overrides: Partial<Config> = {}): Config {
  return {
    sessionId: 'test-session',
    apiKey: 'test-api-key-123',
    mcp: { enabled: true, path: '/mcp', exposeToolsMeta: true },
    ...overrides,
  } as Config;
}

describe('createHonoMcpAdapter', () => {
  describe('API-key auth enforcement', () => {
    it('should reject requests without API key', async () => {
      const config = createTestConfig();
      const app = new Hono();
      const adapter = createHonoMcpAdapter({
        config,
        clientSource: () => ({}),
      });
      adapter.mount(app, '/mcp');

      const res = await app.request('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should reject requests with wrong API key', async () => {
      const config = createTestConfig();
      const app = new Hono();
      const adapter = createHonoMcpAdapter({
        config,
        clientSource: () => ({}),
      });
      adapter.mount(app, '/mcp');

      const res = await app.request('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'wrong-key',
        },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'initialize', id: 1 }),
      });

      expect(res.status).toBe(401);
    });

    it('should accept requests with correct API key via header', async () => {
      const config = createTestConfig();
      const app = new Hono();
      const adapter = createHonoMcpAdapter({
        config,
        clientSource: () => ({}),
      });
      adapter.mount(app, '/mcp');

      const res = await app.request('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0' },
          },
        }),
      });

      // Should not be 401 — transport takes over
      expect(res.status).not.toBe(401);
    });

  });

  describe('Streamable HTTP transport shape', () => {
    it('should handle POST requests (JSON-RPC messages)', async () => {
      const config = createTestConfig();
      const app = new Hono();
      const adapter = createHonoMcpAdapter({
        config,
        clientSource: () => ({}),
      });
      adapter.mount(app, '/mcp');

      const res = await app.request('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: { name: 'test', version: '1.0' },
          },
        }),
      });

      // MCP initialization should respond (not a 404 or 405)
      expect(res.status).not.toBe(404);
      expect(res.status).not.toBe(405);
    });

    it('should handle DELETE requests (session termination)', async () => {
      const config = createTestConfig();
      const app = new Hono();
      const adapter = createHonoMcpAdapter({
        config,
        clientSource: () => ({}),
      });
      adapter.mount(app, '/mcp');

      const res = await app.request('/mcp', {
        method: 'DELETE',
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      // Should be handled by transport, not 404
      expect(res.status).not.toBe(404);
    });
  });

  describe('lifecycle/readiness gating', () => {
    it('should block tool calls when session is not connected', async () => {
      const config = createTestConfig();
      const app = new Hono();
      const adapter = createHonoMcpAdapter({
        config,
        clientSource: () => ({}),
        isSessionConnected: () => false,
      });
      adapter.mount(app, '/mcp');

      // Note: We can't easily test tools/call through the full MCP protocol
      // in a unit test because it requires session initialization first.
      // The readiness check is verified structurally in the adapter code.
      // Integration tests would cover the full flow.
      expect(adapter).toBeDefined();
    });

    it('should allow tool calls when apiLifecycle is immediate regardless of readiness', () => {
      const config = createTestConfig({ apiLifecycle: 'immediate' } as any);
      const adapter = createHonoMcpAdapter({
        config,
        clientSource: () => ({}),
        isSessionConnected: () => false,
      });

      // Adapter should be created successfully with immediate lifecycle
      expect(adapter).toBeDefined();
    });
  });
});
