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

function sampleValue(entry: ConfigManifestEntry): unknown {
  if (entry.default && entry.default !== 'null') {
    try {
      const parsed = JSON.parse(entry.default) as unknown;
      if (parsed !== null && parsed !== undefined) return parsed;
    } catch {
      return entry.default.replace(/^"|"$/g, '');
    }
  }
  if (entry.type === 'boolean') return true;
  if (entry.type === 'number') return 0;
  if (entry.type.endsWith('[]')) return [];
  if (entry.type === 'object' || entry.type.includes('object')) return {};
  return `<${entry.key}>`;
}

function adapterRepresentation(entry: ConfigManifestEntry, format: Format): string | null {
  if (format === 'cli') return entry.cliFlag;
  if (format === 'env') return entry.envVar;
  return null;
}

function snippetValue(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value) ?? '';
}

function setNestedValue(target: Record<string, unknown>, key: string, value: unknown) {
  const parts = key.split('.');
  let current = target;
  for (const part of parts.slice(0, -1)) {
    const existing = current[part];
    if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts.at(-1) as string] = value;
}

function buildSnippet(entries: ConfigManifestEntry[], format: Format): string {
  if (format === 'config') {
    const obj: Record<string, unknown> = {};
    for (const entry of entries) setNestedValue(obj, entry.key, sampleValue(entry));
    return JSON.stringify(obj, null, 2);
  }

  if (format === 'cli') {
    const supported = entries.filter((entry) => entry.cliFlag);
    const configOnly = entries.some((entry) => !entry.cliFlag);
    if (supported.length === 0) {
      return [
        '# These options are available in wa.config.json.',
        'npx @open-wa/wa-automate --config ./wa.config.json',
      ].join('\n');
    }
    const lines = supported.map((entry) =>
      entry.type === 'boolean'
        ? `  ${entry.cliFlag}`
        : `  ${entry.cliFlag} ${JSON.stringify(snippetValue(sampleValue(entry)))}`,
    );
    const command = ['npx @open-wa/wa-automate \\', ...lines].join(' \\\n');
    return configOnly
      ? `# Put config-only options in wa.config.json.\n${command}`
      : command;
  }

  const supported = entries.filter((entry) => entry.envVar);
  if (supported.length === 0) {
    return [
      '# These options are available in wa.config.json.',
      'npx @open-wa/wa-automate --config ./wa.config.json',
    ].join('\n');
  }
  const byVariable = new Map<string, ConfigManifestEntry[]>();
  for (const entry of supported) {
    const values = byVariable.get(entry.envVar as string) ?? [];
    values.push(entry);
    byVariable.set(entry.envVar as string, values);
  }
  const lines = Array.from(byVariable, ([envVar, variableEntries]) => {
    const topLevelKey = variableEntries[0].key.split('.')[0];
    const parentIsRepresented = variableEntries.some(
      (entry) => entry.key === topLevelKey,
    );
    let value: unknown;

    if (parentIsRepresented) {
      const nested: Record<string, unknown> = {};
      for (const entry of variableEntries) {
        if (entry.key === topLevelKey) continue;
        setNestedValue(
          nested,
          entry.key.slice(topLevelKey.length + 1),
          sampleValue(entry),
        );
      }
      value = nested;
    } else {
      value = sampleValue(variableEntries[0]);
    }

    return `${envVar}=${snippetValue(value)}`;
  }).join('\n');
  return entries.some((entry) => !entry.envVar)
    ? `# Put config-only options in wa.config.json.\n${lines}`
    : lines;
}

export function ConfigExplorer() {
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<Format>('config');
  const [group, setGroup] = useState<string>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return configManifest.filter((entry) => {
      if (group !== 'all' && entry.group !== group) return false;
      if (!q) return true;
      return (
        entry.key.toLowerCase().includes(q) ||
        (entry.envVar ?? '').toLowerCase().includes(q) ||
        (entry.cliFlag ?? '').toLowerCase().includes(q) ||
        entry.group.toLowerCase().includes(q) ||
        (entry.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [query, group]);

  const grouped = useMemo(
    () =>
      configGroups
        .map((entryGroup) => ({
          group: entryGroup,
          entries: filtered.filter((entry) => entry.group === entryGroup),
        }))
        .filter((entryGroup) => entryGroup.entries.length > 0),
    [filtered],
  );

  const emptyMessage =
    group !== 'all'
      ? query
        ? `No config options in "${group}" match "${query}".`
        : `No config options in "${group}".`
      : query
        ? `No config options match "${query}".`
        : 'No config options match the current filters.';

  return (
    <div className="not-prose my-4 flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${configManifest.length} config options…`}
            className="w-full min-h-10 rounded-[10px] border border-fd-border bg-fd-background px-3 py-2 text-sm sm:w-64"
            aria-label="Search config options"
          />
          <select
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            className="min-h-10 rounded-[10px] border border-fd-border bg-fd-background px-3 py-2 text-sm"
            aria-label="Filter by group"
          >
            <option value="all">All groups</option>
            {configGroups.map((entryGroup) => (
              <option key={entryGroup} value={entryGroup}>
                {entryGroup}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs text-fd-muted-foreground sm:max-w-sm sm:text-right">
            JSON config supports every schema field. CLI flags and environment variables appear only where the runtime adapter accepts them.
          </p>
          <div className="inline-flex overflow-hidden rounded-[10px] border border-fd-border text-sm">
            {FORMATS.map((entryFormat) => (
              <button
                key={entryFormat.id}
                type="button"
                onClick={() => setFormat(entryFormat.id)}
                aria-pressed={format === entryFormat.id}
                className={`px-3 py-1.5 ${format === entryFormat.id ? 'bg-fd-primary text-fd-primary-foreground' : 'bg-fd-background hover:bg-fd-accent'}`}
              >
                {entryFormat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-fd-border px-3 py-6 text-center text-sm text-fd-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ group: entryGroup, entries }) => (
            <section key={entryGroup} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">
                {entryGroup}{' '}
                <span className="font-normal normal-case">({entries.length})</span>
              </h3>
              <div className="divide-y divide-fd-border/60 rounded-lg border border-fd-border">
                {entries.map((entry) => {
                  const supported =
                    format === 'config' ||
                    (format === 'cli' ? Boolean(entry.cliFlag) : Boolean(entry.envVar));
                  const schemaField = entry.key.split('.')[0];
                  return (
                    <div key={entry.key} className="flex flex-col gap-1.5 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`/docs/guides/config-schema#type-table-config.ts-Config-${schemaField}`}
                          className="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-xs hover:text-fd-primary hover:underline hover:underline-offset-2"
                          title={`Open the config schema at ${schemaField}`}
                        >
                          <code className="break-all">{entry.key}</code>
                        </a>
                        {!supported ? (
                          <span className="rounded border border-fd-border px-1.5 py-0.5 text-[11px] text-fd-muted-foreground">
                            {format === 'cli' ? 'CLI adapter unavailable' : 'Env adapter unavailable'} · config file only
                          </span>
                        ) : null}
                        {format !== 'config' && adapterRepresentation(entry, format) ? (
                          <code className="break-all rounded border border-fd-border px-1.5 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
                            {adapterRepresentation(entry, format)}
                          </code>
                        ) : null}
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
                      {entry.description ? (
                        <p className="text-sm text-fd-muted-foreground">{entry.description}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <details className="rounded-lg border border-fd-border">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
          Show the {filtered.length} shown option{filtered.length === 1 ? '' : 's'} as{' '}
          {FORMATS.find((entryFormat) => entryFormat.id === format)?.label}
        </summary>
        <pre className="overflow-x-auto px-3 py-2 text-xs">
          <code>{buildSnippet(filtered, format)}</code>
        </pre>
      </details>
    </div>
  );
}
