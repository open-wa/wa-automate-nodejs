import * as React from 'react';

function TypeDisplay({ value, namedType }: { value: string; namedType?: string }) {
  const links: Record<string, string> = {
    ChatId: '/docs/concepts/glossary#chatid',
    ContactId: '/docs/concepts/glossary#contactid',
    GroupChatId: '/docs/concepts/glossary#groupchatid',
  };

  if (value.length > 180) return <details className="reference-type-details"><summary>Object · view fields</summary><pre><code>{value.replace(/; /g, ';\n')}</code></pre></details>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 align-middle">
      <code className="rounded-md border border-border bg-accent px-2 py-1 text-[0.84em] text-foreground">{value}</code>
      {namedType ? links[namedType] ? <a href={links[namedType]} className="text-[13px] text-primary underline decoration-primary/40 underline-offset-2">{namedType}</a> : <span className="text-[13px] text-primary">{namedType}</span> : null}
    </span>
  );
}

/** Lowercase letters and digits only, so "send text" finds `sendText`. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * The A–Z method lookup. The generated page passes its method table as
 * children, so every method name, summary and link is in the server-rendered
 * HTML and the Markdown copy; this only adds a filter box that hides rows.
 */
export function ClientReference({ total, children }: { total?: number; children?: React.ReactNode }) {
  const [query, setQuery] = React.useState('');
  const [shown, setShown] = React.useState<number | null>(null);
  const tableRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const needle = normalize(query);
    let count = 0;
    for (const row of tableRef.current?.querySelectorAll<HTMLTableRowElement>('tbody tr') ?? []) {
      const match = !needle || normalize(row.textContent ?? '').includes(needle);
      row.hidden = !match;
      if (match) count += 1;
    }
    setShown(needle ? count : null);
  }, [query]);

  return (
    <div className="method-lookup">
      <div role="search" className="not-prose my-4 flex flex-col gap-2">
        <label htmlFor="method-lookup-filter" className="text-sm font-medium">Filter methods</label>
        <input
          id="method-lookup-filter"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Method name or job, such as sendText or group"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        />
        <p aria-live="polite" className="text-sm text-fd-muted-foreground">
          {shown === null ? `${total ?? ''} methods`.trim() : `${shown} of ${total ?? '?'} methods match`}
          {shown === 0 ? <> · <button type="button" className="underline underline-offset-2" onClick={() => setQuery('')}>Clear the filter</button></> : null}
        </p>
      </div>
      <div ref={tableRef}>{children}</div>
    </div>
  );
}

export { TypeDisplay };
