/**
 * Tests for the shared execution kernel.
 *
 * These tests verify that executeCapability produces identical
 * normalization, validation, and error shaping as the HTTP path.
 */
import { describe, it, expect, vi } from 'vitest';
import { executeCapability, type ExecutionContext } from '../src/execution/kernel';
import { z } from 'zod';
import type { HttpMethodDefinition } from '@open-wa/schema';

/**
 * Helper to create a minimal HttpMethodDefinition-like object for testing.
 */
function createMockDefinition(overrides: Partial<HttpMethodDefinition> = {}): HttpMethodDefinition {
  return {
    functionName: 'sendText',
    namespacedName: 'sendText',
    path: '/api/messages/sendText',
    namespace: 'messages',
    description: 'Send a text message',
    httpMethod: 'POST',
    inputSchema: z.object({
      to: z.string(),
      content: z.string(),
    }),
    outputSchema: z.any(),
    parameterOrder: ['to', 'content'],
    aliases: [],
    deprecatedAliases: [],
    aliasRoutes: [],
    routeSignatures: [],
    invocationNames: ['sendText'],
    keyAliasMap: {},
    ...overrides,
  };
}

describe('executeCapability', () => {
  it('should return success with data when invocation succeeds', async () => {
    const mockClient = {
      sendText: vi.fn().mockResolvedValue({ id: 'msg-123' }),
    };

    const result = await executeCapability({
      client: mockClient,
      definition: createMockDefinition(),
      payload: { to: '1234567890@c.us', content: 'Hello' },
      sessionId: 'test-session',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ id: 'msg-123' });
    expect(mockClient.sendText).toHaveBeenCalled();
  });

  it('should return 400 for Zod validation errors', async () => {
    const mockClient = {
      sendText: vi.fn(),
    };

    const result = await executeCapability({
      client: mockClient,
      definition: createMockDefinition(),
      payload: { to: 123, content: null } as any, // invalid types
      sessionId: 'test-session',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBe('Validation Error');
    expect(result.details).toBeDefined();
    expect(mockClient.sendText).not.toHaveBeenCalled();
  });

  it('should return 500 for client runtime errors', async () => {
    const mockClient = {
      sendText: vi.fn().mockRejectedValue(new Error('WhatsApp connection lost')),
    };

    const result = await executeCapability({
      client: mockClient,
      definition: createMockDefinition(),
      payload: { to: '1234567890@c.us', content: 'Hello' },
      sessionId: 'test-session',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
    expect(result.error).toBe('WhatsApp connection lost');
  });

  it('should log success to elasticEmitter when provided', async () => {
    const mockEmitter = { log: vi.fn() };
    const mockClient = {
      sendText: vi.fn().mockResolvedValue('ok'),
    };

    await executeCapability({
      client: mockClient,
      definition: createMockDefinition(),
      payload: { to: '1234567890@c.us', content: 'Hello' },
      sessionId: 'test-session',
      elasticEmitter: mockEmitter,
    });

    expect(mockEmitter.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        method: 'sendText',
        statusCode: 200,
      }),
    );
  });

  it('should log errors to elasticEmitter when provided', async () => {
    const mockEmitter = { log: vi.fn() };
    const mockClient = {
      sendText: vi.fn().mockRejectedValue(new Error('fail')),
    };

    await executeCapability({
      client: mockClient,
      definition: createMockDefinition(),
      payload: { to: '1234567890@c.us', content: 'Hello' },
      sessionId: 'test-session',
      elasticEmitter: mockEmitter,
    });

    expect(mockEmitter.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        method: 'sendText',
        statusCode: 500,
      }),
    );
  });

  it('should handle undefined client gracefully', async () => {
    const result = await executeCapability({
      client: undefined,
      definition: createMockDefinition(),
      payload: { to: '1234567890@c.us', content: 'Hello' },
      sessionId: 'test-session',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(500);
  });
});
