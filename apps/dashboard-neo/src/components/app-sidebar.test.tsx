// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock dependencies
vi.mock('@/lib/hooks/use-health', () => ({
  useHealth: vi.fn(),
}));

// We must mock Router components since Sidebar uses Router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: any) => <a>{children}</a>,
  useRouter: () => ({
    state: { location: { pathname: '/' } },
    subscribe: vi.fn(),
  }),
}));

import { useHealth } from '@/lib/hooks/use-health';
import { AppSidebar } from './app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderSidebar = () => {
    // The Sidebar component needs the SidebarProvider
    return render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );
  };

  it('hides MCP link when mcpAvailable is false', () => {
    vi.mocked(useHealth).mockReturnValue({
      mcpAvailable: false,
      plugins: [],
    } as any);

    renderSidebar();

    // Check that MCP is NOT visible
    expect(screen.queryByText('MCP')).toBeNull();
  });

  it('shows MCP link when mcpAvailable is true', () => {
    vi.mocked(useHealth).mockReturnValue({
      mcpAvailable: true,
      plugins: [],
    } as any);

    renderSidebar();

    // Check that MCP IS visible
    expect(screen.getByText('MCP')).toBeDefined();
  });
});
