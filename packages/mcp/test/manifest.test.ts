/**
 * Tests for MCP manifest generation from schema registry.
 */
import { describe, it, expect } from 'vitest';
import { getMcpToolDefinitions, type McpToolDefinition } from '../src/manifest';
import { getCanonicalToolName } from '../src/tool-naming';

describe('getMcpToolDefinitions', () => {
  let tools: McpToolDefinition[];

  // We import @open-wa/schema/methods to populate the registry
  beforeAll(async () => {
    await import('@open-wa/schema/methods');
    tools = getMcpToolDefinitions();
  });

  it('should return a non-empty array of tool definitions', () => {
    expect(tools).toBeInstanceOf(Array);
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should produce one tool per method (no duplicates)', () => {
    const names = tools.map((t) => t.toolName);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('every tool should have a namespace.method toolName shape', () => {
    for (const tool of tools) {
      expect(tool.toolName).toMatch(/^[a-zA-Z]+\.[a-zA-Z]+/);
      expect(tool.toolName).toBe(getCanonicalToolName(tool.namespace, tool.namespacedName));
    }
  });

  it('every tool should have a valid Zod inputSchema', () => {
    for (const tool of tools) {
      expect(tool.inputSchema).toBeDefined();
      expect(typeof tool.inputSchema.parse).toBe('function');
    }
  });

  it('every tool should carry parameterOrder and keyAliasMap', () => {
    for (const tool of tools) {
      expect(tool.parameterOrder).toBeInstanceOf(Array);
      expect(tool.keyAliasMap).toBeDefined();
      expect(typeof tool.keyAliasMap).toBe('object');
    }
  });

  it('should include annotations with readOnlyHint for getters', () => {
    const getters = tools.filter((t) => t.functionName.startsWith('get') || t.functionName.startsWith('is'));
    for (const getter of getters) {
      expect(getter.annotations?.readOnlyHint).toBe(true);
    }

    const mutators = tools.filter((t) => t.functionName.startsWith('send'));
    for (const mutator of mutators) {
      expect(mutator.annotations?.readOnlyHint).toBeFalsy();
    }
  });
});
