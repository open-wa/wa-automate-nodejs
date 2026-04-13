// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock dependencies
vi.mock('@/lib/hooks/use-health', () => ({
  useHealth: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  getApiUrl: vi.fn(),
}));

// Mock icons to avoid rendering complexities
vi.mock('lucide-react', () => ({
  Bot: () => null,
  Terminal: () => null,
  ShieldCheck: () => null,
  Cpu: () => null,
  ArrowRight: () => null,
  ClipboardCheck: () => null,
  CheckCircle2: () => null,
  XCircle: () => null,
  ExternalLink: () => null,
  Code2: () => null,
  BookOpen: () => null,
  KeyRound: () => null,
  Copy: () => null,
}));

import { useHealth } from '@/lib/hooks/use-health';
import { getApiUrl } from '@/lib/api-client';
import { McpPage } from './mcp';

// Mock react's useState
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useState: (initial: any) => [initial, vi.fn()]
  };
});

describe('McpPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the properly disabled state when mcp is completely unavailable', () => {
    vi.mocked(useHealth).mockReturnValue({
      mcpAvailable: false,
      mcpEnabled: false,
      mcpPath: '/mcp',
      loading: false,
    } as any);
    vi.mocked(getApiUrl).mockReturnValue('http://localhost:8080');

    const result = JSON.stringify(McpPage());
    expect(result).toContain('MCP is currently Disabled'); // lowercase 'c'
  });

  it('renders unavailable availability state', () => {
    vi.mocked(useHealth).mockReturnValue({
      mcpAvailable: false,
      mcpEnabled: true,
      mcpPath: '/mcp',
      loading: false,
    } as any);
    vi.mocked(getApiUrl).mockReturnValue('http://localhost:8080');

    const resultAvailability = JSON.stringify(McpPage());
    // The StatusCard for availability should show "Unavailable"
    expect(resultAvailability).toContain('Unavailable');
    expect(resultAvailability).toContain('This build does not support MCP');
  });

  it('renders the full MCP page with URL and auth info when available', () => {
    vi.mocked(useHealth).mockReturnValue({
      mcpAvailable: true,
      mcpEnabled: true,
      mcpPath: '/mcp',
      loading: false,
    } as any);
    vi.mocked(getApiUrl).mockReturnValue('http://localhost:8080');

    const result = JSON.stringify(McpPage());
    expect(result).toContain('http://localhost:8080/mcp');
    expect(result).toContain('API Key Required');
    expect(result).toContain('/meta/mcp-tools.json');
  });
});
