import { useMemo, useState } from 'react';
import {
  configManifest,
  configGroups,
  type ConfigManifestEntry,
} from '@/generated/config-manifest';

type Format = 'config' | 'cli' | 'env';

const FORMATS: { id: Format; label: string }[] = [
  { id: 'config', label: 'wa.config.json' },
  { id: 'cli', label: 'CLI flags' },
  { id: 'env', label: 'Env vars' },
];

function sampleValue(entry: ConfigManifestEntry): string {
  if (entry.default && entry.default !== 'null') {
    try {
      const parsed = JSON.parse(entry.default) as unknown;
      if (typeof parsed === 'string') return parsed;
      if (parsed === null || parsed === undefined) return `<${entry.key}>`;
      return typeof parsed === 'object'
        ? JSON.stringify(parsed)
        : String(parsed);
    } catch {
      return entry.default.replace(/^"|"$/g, '');
    }
  }
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
      .map((e) =>
        e.type === 'boolean'
          ? `  ${e.cliFlag}`
          : `  ${e.cliFlag} ${JSON.stringify(sampleValue(e))}`,
      )
      .join(' \\\n')}`;
  }
  return entries.map((e) => `${e.envVar}=${sampleValue(e)}`).join('\n');
}

export function ConfigExplorer() {
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<Format>('config');
  const [group, setGroup] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return configManifest.filter((e) => {
      if (group !== 'all' && e.group !== group) return false;
      if (!q) return true;
      return (
        e.key.toLowerCase().includes(q) ||
        e.envVar.toLowerCase().includes(q) ||
        (e.cliFlag ?? '').toLowerCase().includes(q) ||
        (e.group ?? '').toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [query, group]);

  const grouped = useMemo(() => {
    return configGroups
      .map((g) => ({
        group: g,
        entries: filtered.filter((e) => e.group === g),
      }))
      .filter((g) => g.entries.length > 0);
  }, [filtered]);

  const emptyMessage =
    group !== 'all'
      ? query
        ? `No config options in "${group}" match "${query}".`
        : `No config options in "${group}".`
      : query
        ? `No config options match "${query}".`
        : 'No config options match the current filters.';

  return (
    <div className="not-prose flex flex-col gap-4 my-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${configManifest.length} config options…`}
            className="w-full sm:w-64 rounded-md border border-fd-border bg-fd-background px-3 py-1.5 text-sm"
            aria-label="Search config options"
          />
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="rounded-md border border-fd-border bg-fd-background px-3 py-1.5 text-sm"
            aria-label="Filter by group"
          >
            <option value="all">All groups</option>
            {configGroups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="inline-flex rounded-md border border-fd-border overflow-hidden text-sm">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              aria-pressed={format === f.id}
              className={`px-3 py-1.5 ${format === f.id ? 'bg-fd-primary text-fd-primary-foreground' : 'bg-fd-background hover:bg-fd-accent'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-fd-border px-3 py-6 text-center text-sm text-fd-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ group: g, entries }) => (
            <section key={g} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">
                {g}{' '}
                <span className="font-normal normal-case">
                  ({entries.length})
                </span>
              </h3>
              <div className="divide-y divide-fd-border/60 rounded-lg border border-fd-border">
                {entries.map((entry) => (
                  <div key={entry.key} className="flex flex-col gap-1.5 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-xs break-all">
                        {representation(entry, format)}
                      </code>
                      <span className="rounded border border-fd-border px-1.5 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
                        {entry.type}
                      </span>
                      {entry.default && entry.default !== 'null' ? (
                        <span className="rounded border border-fd-border px-1.5 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
                          default: {entry.default}
                        </span>
                      ) : (
                        <span className="rounded border border-fd-border px-1.5 py-0.5 text-[11px] text-fd-muted-foreground">
                          optional
                        </span>
                      )}
                    </div>
                    {entry.description && (
                      <p className="text-sm text-fd-muted-foreground">
                        {entry.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <details className="rounded-lg border border-fd-border">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
          Show the {filtered.length} shown option
          {filtered.length === 1 ? '' : 's'} as{' '}
          {FORMATS.find((f) => f.id === format)?.label}
        </summary>
        <pre className="overflow-x-auto px-3 py-2 text-xs">
          <code>{buildSnippet(filtered, format)}</code>
        </pre>
      </details>
    </div>
  );
}
