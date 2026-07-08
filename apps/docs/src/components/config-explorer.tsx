import { useMemo, useState } from 'react';
import { configManifest, type ConfigManifestEntry } from '@/generated/config-manifest';

type Format = 'config' | 'cli' | 'env';

const FORMATS: { id: Format; label: string }[] = [
  { id: 'config', label: 'wa.config.json' },
  { id: 'cli', label: 'CLI flags' },
  { id: 'env', label: 'Env vars' },
];

function sampleValue(entry: ConfigManifestEntry): string {
  if (entry.default && entry.default !== 'null') return entry.default.replace(/^"|"$/g, '');
  if (entry.type === 'boolean') return 'true';
  if (entry.type === 'number') return '0';
  if (entry.type.endsWith('[]')) return '';
  return `<${entry.key}>`;
}

function representation(entry: ConfigManifestEntry, format: Format): string {
  if (format === 'cli') return entry.cliFlag ?? '(config/env only)';
  if (format === 'env') return entry.envVar;
  return entry.key;
}

function buildSnippet(entries: ConfigManifestEntry[], format: Format): string {
  if (format === 'config') {
    const obj: Record<string, unknown> = {};
    for (const e of entries) {
      if (e.key.includes('.')) continue; // keep the sample flat
      let v: unknown = sampleValue(e);
      if (e.type === 'boolean') v = v === 'true';
      else if (e.type === 'number') v = Number(v);
      obj[e.key] = v;
    }
    return JSON.stringify(obj, null, 2);
  }
  if (format === 'cli') {
    return `npx @open-wa/wa-automate \\\n${entries
      .filter((e) => e.cliFlag)
      .map((e) => (e.type === 'boolean' ? `  ${e.cliFlag}` : `  ${e.cliFlag} ${JSON.stringify(sampleValue(e))}`))
      .join(' \\\n')}`;
  }
  return entries.map((e) => `${e.envVar}=${sampleValue(e)}`).join('\n');
}

export function ConfigExplorer() {
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<Format>('config');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return configManifest;
    return configManifest.filter(
      (e) =>
        e.key.toLowerCase().includes(q) ||
        e.envVar.toLowerCase().includes(q) ||
        (e.cliFlag ?? '').toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="not-prose flex flex-col gap-4 my-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${configManifest.length} config options…`}
          className="w-full sm:max-w-xs rounded-md border border-fd-border bg-fd-background px-3 py-1.5 text-sm"
          aria-label="Search config options"
        />
        <div className="inline-flex rounded-md border border-fd-border overflow-hidden text-sm">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              className={`px-3 py-1.5 ${format === f.id ? 'bg-fd-primary text-fd-primary-foreground' : 'bg-fd-background hover:bg-fd-accent'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-fd-border">
        <table className="w-full text-sm">
          <thead className="bg-fd-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">{FORMATS.find((f) => f.id === format)?.label}</th>
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-left px-3 py-2 font-medium">Default</th>
              <th className="text-left px-3 py-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.key} className="border-t border-fd-border/60 align-top">
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{representation(entry, format)}</td>
                <td className="px-3 py-2 font-mono text-xs text-fd-muted-foreground whitespace-nowrap">{entry.type}</td>
                <td className="px-3 py-2 font-mono text-xs text-fd-muted-foreground whitespace-nowrap">
                  {entry.default ?? '—'}
                </td>
                <td className="px-3 py-2 text-fd-muted-foreground">{entry.description ?? ''}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-fd-muted-foreground">
                  No config options match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <details className="rounded-lg border border-fd-border">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
          Show the {filtered.length} shown option{filtered.length === 1 ? '' : 's'} as {FORMATS.find((f) => f.id === format)?.label}
        </summary>
        <pre className="overflow-x-auto px-3 py-2 text-xs">
          <code>{buildSnippet(filtered, format)}</code>
        </pre>
      </details>
    </div>
  );
}
