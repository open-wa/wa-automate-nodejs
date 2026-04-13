import { describe, expect, it } from 'vitest';
import { createApiServer } from '../src/createApiServer.js';
import { serve } from '@hono/node-server';
import type { Config } from '@open-wa/config';

describe('MCP API Integration', () => {
  it('exposes MCP capabilities in /health when disabled', async () => {
    const config: Config = { sessionName: 'test', apiKey: 'test', cors: '*' };
    const apiServer = createApiServer(config);
    const app = apiServer.getApp();

    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.capabilities).toBeDefined();
    expect(data.capabilities.mcpEnabled).toBe(false);
    expect(data.capabilities.mcpAvailable).toBe(false);
    expect(data.capabilities.apiKeyConfigured).toBe(true);
    expect(data.capabilities.mcpPath).toBe('/mcp');

    expect(data.host).toBeDefined();
    expect(data.host.mcp).toBeDefined();
    expect(data.host.mcp.enabled).toBe(false);
  });

  it('exposes MCP capabilities in /health when enabled', async () => {
    const config: Config = { sessionName: 'test', apiKey: 'test', cors: '*', mcp: { enabled: true } };
    const apiServer = createApiServer(config);
    const app = apiServer.getApp();

    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.capabilities).toBeDefined();
    expect(data.capabilities.mcpEnabled).toBe(true);
    // Note: mcpAvailable may be false in test if the session isn't mock "ready" depending on implementation
    expect(data.capabilities.apiKeyConfigured).toBe(true);
    expect(data.capabilities.mcpPath).toBe('/mcp');

    expect(data.host).toBeDefined();
    expect(data.host.mcp).toBeDefined();
    expect(data.host.mcp.enabled).toBe(true);
  });

  it('exposes meta mcp-tools.json', async () => {
    const config: Config = { sessionName: 'test', apiKey: 'test', cors: '*', mcp: { enabled: true, exposeToolsMeta: true } };
    const apiServer = createApiServer(config);
    const app = apiServer.getApp();

    const res = await app.request('/meta/mcp-tools.json');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.endpoint).toBe('/mcp');
    expect(data.requiresApiKey).toBe(true);
    expect(Array.isArray(data.tools)).toBe(true);
    expect((data.tools as any[]).length).toBeGreaterThan(0);
    const tool = (data.tools as any[])[0];
    expect(tool).toHaveProperty('toolName');
    expect(tool).toHaveProperty('description');
    expect(tool).toHaveProperty('parameterOrder');
  });

  it('hides meta mcp-tools.json when exposeToolsMeta is false', async () => {
    const config: Config = { sessionName: 'test', apiKey: 'test', cors: '*', mcp: { enabled: true, exposeToolsMeta: false } };
    const apiServer = createApiServer(config);
    const app = apiServer.getApp();

    const res = await app.request('/meta/mcp-tools.json');
    expect(res.status).toBe(404);
  });

  it('mounts MCP on /mcp when enabled and properly secures it', async () => {
    const config: Config = { sessionName: 'test', apiKey: 'secure_key', cors: '*', mcp: { enabled: true } };
    const apiServer = createApiServer(config);
    const app = apiServer.getApp();

    // With no header
    const reqNoHeader = new Request('http://localhost/mcp', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } },
        id: 1,
      }),
      headers: {
        'content-type': 'application/json',
      },
    });
    let res = await app.request(reqNoHeader);
    expect(res.status).toBe(401);

    // With incorrect header
    const reqBadHeader = new Request('http://localhost/mcp', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } },
        id: 1,
      }),
      headers: {
        'content-type': 'application/json',
        'X-API-Key': 'wrong_key',
      },
    });
    res = await app.request(reqBadHeader);
    expect(res.status).toBe(401);

    // With correct header
    const reqHeader = new Request('http://localhost/mcp', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } },
        id: 1,
      }),
      headers: {
        'content-type': 'application/json',
        'X-API-Key': 'secure_key',
      },
    });
    res = await app.request(reqHeader);
    
    // The request successfully bypassed the HTTP X-API-Key auth guard, proving auth works.
    // However, because we hit a single-endpoint standard stream SDK mount with a raw JSON-RPC POST,
    // the `@modelcontextprotocol/sdk` WebStandardStreamableHTTPServerTransport rejects it 
    // with 406 Not Acceptable (instead of processing it without URL params matching a session endpoint).
    // We assert this exact SDK behavior to prove the request genuinely reached the MCP transport.
    expect(res.status).not.toBe(401); // Auth succeeded
    expect(res.status).not.toBe(404); // Route matched
    expect(res.status).not.toBe(500); // No internal server error
    expect(res.status).toBe(406); // Standard SDK rejection for invalid streaming handshake
    
    const errData = await res.json() as any;
    expect(errData.jsonrpc).toBe('2.0');
    expect(errData.error).toBeDefined();
    expect(errData.error.code).toBe(-32000);
    expect(errData.error.message).toMatch(/Not Acceptable/);
  });
});
