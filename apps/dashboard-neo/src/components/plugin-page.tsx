import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/application/page-header';
import { DetailSheet } from '@/components/application/detail-sheet';
import * as table from '@/components/boardui/table';
import { Textarea } from '@/components/ui/textarea';
import { useCalling } from '@/lib/hooks/use-calling';
import { usePrivacy } from '@/lib/hooks/use-privacy';
import { pluginJson, pluginRequest, watchPlugin } from '@/lib/plugin-api';

class PluginPageBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div role="alert" className="dashboard-page"><h1 className="text-xl font-semibold">The plugin page could not render</h1><p className="mt-2 text-sm">Reload the page to reconnect. Your WhatsApp session and server-owned assistant calls continue running.</p></div> : this.props.children;
  }
}

/** Installed plugin modules use Neo's React instance and authenticated, scoped requests. */
export async function loadPluginComponent(name: string, module: string, factory: 'createPage' | 'createChat', signal: AbortSignal): Promise<React.ComponentType<any>> {
  if (!/^[a-zA-Z0-9_./-]+\.js$/.test(module) || module.split('/').includes('..')) throw new Error('The plugin declared an invalid browser module.');
  const source = await (await pluginRequest(name, module, { signal })).text();
  const blob = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  try {
    const entry = await import(/* @vite-ignore */ blob);
    signal.throwIfAborted();
    if (typeof entry[factory] !== 'function') throw new Error(`A plugin module must export ${factory}(host).`);
    const component = entry[factory]({
      React, ui: { Button, Input, Textarea, PageHeader, DetailSheet, ...table }, useCalling, usePrivacy,
      chatUrl: (peer: string) => { const url = new URL('chat', new URL(import.meta.env.BASE_URL, location.origin)); url.searchParams.set('chatId', peer); return url.pathname + url.search; },
      request: (path: string, init?: RequestInit) => pluginRequest(name, path, init),
      json: (path: string, init?: RequestInit) => pluginJson(name, path, init),
      watch: (path: string, receive: (snapshot: unknown) => void, streamSignal: AbortSignal) => watchPlugin(name, path, receive, streamSignal),
    });
    if (typeof component !== 'function') throw new Error('The plugin did not return a component.');
    return component;
  } finally { URL.revokeObjectURL(blob); }
}

export function PluginPage({ name, module }: { name: string; module: string }) {
  const [Page, setPage] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setPage(null); setError(null);
    void (async () => {
      const component = await loadPluginComponent(name, module, 'createPage', controller.signal);
      if (controller.signal.aborted) return;
      setPage(() => component);
    })().catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { controller.abort(); };
  }, [name, module]);
  if (error) return <div role="alert" className="dashboard-page space-y-3"><h1 className="text-xl font-semibold">Could not open {name}</h1><p>{error}</p></div>;
  return Page ? <PluginPageBoundary key={`${name}:${module}`}><Page /></PluginPageBoundary> : <p role="status" className="p-6 text-sm text-muted-foreground">Opening plugin…</p>;
}
