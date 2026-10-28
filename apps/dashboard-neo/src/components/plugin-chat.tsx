import * as React from 'react';
import { getApiKey, getApiUrl } from '@/lib/api-client';
import { loadPluginComponent } from './plugin-page';

export type ChatFeedAddition = { id: string; at: number; messageId?: string; content: React.ReactNode };
type ChatView = { toolbar?: React.ReactNode; entries: ChatFeedAddition[] };
type Extension = { name: string; Component: React.ComponentType<{ chatId: string; children: (view: ChatView) => React.ReactNode }> };

class ChatPluginBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** A plugin contributes UI; the existing Chat view still owns the message feed. */
export function PluginChat({ chatId, enabled, children }: { chatId: string; enabled: boolean; children: (view: ChatView) => React.ReactNode }) {
  const [extensions, setExtensions] = React.useState<Extension[]>([]);
  const [error, setError] = React.useState('');
  const apiUrl = getApiUrl();
  React.useEffect(() => {
    if (!enabled) { setExtensions([]); return; }
    const controller = new AbortController();
    setExtensions([]); setError('');
    void (async () => {
      const key = getApiKey();
      const response = await fetch(new URL('/plugins/manifest', apiUrl), { signal: controller.signal, headers: key ? { 'X-API-Key': key } : {} });
      if (!response.ok) throw new Error('Chat plugins could not connect.');
      const manifest = await response.json();
      const modules = await Promise.allSettled((manifest.plugins ?? []).filter((plugin: any) => plugin.chat?.module).map(async (plugin: any) => ({
        name: plugin.name, Component: await loadPluginComponent(plugin.name, plugin.chat.module, 'createChat', controller.signal),
      })));
      if (controller.signal.aborted) return;
      setExtensions(modules.flatMap(result => result.status === 'fulfilled' ? [result.value as Extension] : []));
      if (modules.some(result => result.status === 'rejected')) setError('A chat plugin could not open. Reload to reconnect its controls.');
    })().catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [enabled, apiUrl]);

  const render = (index: number, view: ChatView): React.ReactNode => {
    if (index === extensions.length) return children(view);
    const { name, Component } = extensions[index];
    return <ChatPluginBoundary key={`${name}:${chatId}`} fallback={render(index + 1, { ...view, toolbar: <>{view.toolbar}<p role="alert" className="px-4 py-2 text-sm">{name}'s chat controls could not render. Reload to reconnect.</p></> })}>
      <Component chatId={chatId}>{next => render(index + 1, {
        toolbar: <>{view.toolbar}{next.toolbar}</>,
        entries: [...view.entries, ...next.entries.map(entry => ({ ...entry, id: `${name}:${entry.id}` }))],
      })}</Component>
    </ChatPluginBoundary>;
  };
  return render(0, { entries: [], toolbar: error ? <p role="alert" className="border-b px-4 py-2 text-sm">{error}</p> : null });
}
