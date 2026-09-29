import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  ApiReferenceReact,
  type AnyApiReferenceConfiguration,
} from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';
import * as React from 'react';
import { DocsShell } from './docs/-shell';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { DocsPage } from 'fumadocs-ui/layouts/notebook/page';

const DEFAULT_HOST = 'http://localhost:8080';
const HOST_STORAGE_KEY = 'openwa.docs.apiExplorer.host';
const API_KEY_STORAGE_KEY = 'openwa.docs.apiExplorer.apiKey';
const REMEMBER_API_KEY_STORAGE_KEY = 'openwa.docs.apiExplorer.rememberApiKey';

type OpenApiDocument = Record<string, unknown> & {
  servers?: Array<Record<string, unknown>>;
  info?: { version?: string };
  paths?: Record<string, Record<string, unknown>>;
};

const pageTreeLoader = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { source } = await import('@/lib/source');

  return {
    pageTree: await source.serializePageTree(source.pageTree),
  };
});

export const Route = createFileRoute('/api-explorer')({
  component: ApiExplorerPage,
  loader: () => pageTreeLoader(),
});

function normalizeHost(value: string): { value: string | null; error: string | null } {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return { value: null, error: 'Enter an instance base URL.' };

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { value: null, error: 'Use an http:// or https:// base URL.' };
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
      return {
        value: null,
        error: 'Use a base URL without credentials, query parameters, or a fragment.',
      };
    }

    return {
      value: `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`,
      error: null,
    };
  } catch {
    return { value: null, error: 'Enter a complete URL, for example http://localhost:8080.' };
  }
}

function appendPath(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function schemaExample(schema: Record<string, any> | undefined): unknown {
  if (!schema) return undefined;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  if (schema.anyOf?.length || schema.oneOf?.length) {
    return schemaExample((schema.anyOf ?? schema.oneOf)[0]);
  }
  if (schema.type === 'object' || schema.properties) {
    const result: Record<string, unknown> = {};
    for (const [key, property] of Object.entries(schema.properties ?? {})) {
      const example = schemaExample(property as Record<string, any>);
      if (example !== undefined && (schema.required ?? []).includes(key)) {
        result[key] = example;
      }
    }
    return result;
  }
  if (schema.type === 'array') {
    const item = schemaExample(schema.items);
    return item === undefined ? [] : [item];
  }
  if (schema.type === 'integer' || schema.type === 'number') {
    return Math.max(schema.minimum ?? 1, 1);
  }
  if (schema.type === 'boolean') return true;
  if (schema.pattern?.includes('@')) return '447123456789@c.us';
  if (schema.pattern?.includes('\\d')) return '123456789';
  if (schema.minLength) return 'Hello from open-wa';
  if (schema.format === 'uri' || schema.format === 'uri-reference') return 'https://example.com';
  if (schema.format === 'date-time') return '2026-01-01T00:00:00.000Z';
  if (schema.type === 'string') return 'example';
  return undefined;
}

function addExamples(spec: OpenApiDocument): OpenApiDocument {
  const paths = Object.fromEntries(
    Object.entries(spec.paths ?? {}).map(([path, pathItem]) => {
      const nextPathItem = { ...(pathItem as Record<string, any>) };
      for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
        const operation = nextPathItem[method] as Record<string, any> | undefined;
        if (!operation) continue;

        const requestContent = operation.requestBody?.content?.['application/json'];
        if (requestContent?.schema && !requestContent.example && !requestContent.examples) {
          const example = schemaExample(requestContent.schema);
          if (example !== undefined) requestContent.example = example;
        }

        const successContent = operation.responses?.['200']?.content?.['application/json'];
        if (successContent?.schema && !successContent.example && !successContent.examples) {
          const example = schemaExample(successContent.schema);
          if (example !== undefined) successContent.example = example;
        }

        nextPathItem[method] = operation;
      }
      return [path, nextPathItem];
    }),
  );

  return { ...spec, paths };
}

function withServer(spec: OpenApiDocument, host: string): OpenApiDocument {
  return {
    ...addExamples(spec),
    servers: [{ url: host }],
  };
}

function ApiExplorerPage() {
  const docsData = Route.useLoaderData();
  const [hostInput, setHostInput] = React.useState(DEFAULT_HOST);
  const [apiKey, setApiKey] = React.useState('');
  const [rememberApiKey, setRememberApiKey] = React.useState(false);
  const [settingsSaved, setSettingsSaved] = React.useState(false);
  const [spec, setSpec] = React.useState<OpenApiDocument | null>(null);
  const [catalogOrigin, setCatalogOrigin] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedHost = window.localStorage.getItem(HOST_STORAGE_KEY);
    const remembered = window.localStorage.getItem(REMEMBER_API_KEY_STORAGE_KEY) === 'true';
    const storedApiKey = remembered
      ? window.localStorage.getItem(API_KEY_STORAGE_KEY)
      : window.sessionStorage.getItem(API_KEY_STORAGE_KEY);

    if (storedHost) setHostInput(storedHost);
    if (storedApiKey) setApiKey(storedApiKey);
    setRememberApiKey(remembered);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setCatalogOrigin(window.location.origin);

    fetch('/openapi.json')
      .then((response) => {
        if (!response.ok)
          throw new Error(`OpenAPI spec returned ${response.status}`);
        return response.json() as Promise<OpenApiDocument>;
      })
      .then((document) => {
        if (!cancelled) setSpec(document);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load OpenAPI spec',
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hostState = normalizeHost(hostInput);
  const host = hostState.value;
  const configuration =
    React.useMemo<AnyApiReferenceConfiguration | null>(() => {
      if (!spec || !host) return null;

      return {
        content: withServer(spec, host),
        theme: 'none',
        layout: 'classic',
        hideDarkModeToggle: true,
        showDeveloperTools: 'never',
        withDefaultFonts: false,
        defaultHttpClient: {
          targetKey: 'shell',
          clientKey: 'curl',
        },
        authentication: apiKey
          ? {
              preferredSecurityScheme: 'openWaApiKey',
              securitySchemes: {
                openWaApiKey: {
                  type: 'apiKey',
                  in: 'header',
                  name: 'X-API-Key',
                  value: apiKey,
                },
              },
            }
          : undefined,
        customCss: `
        .scalar-api-reference, .scalar-app {
          font-family: var(--font-sans) !important;
          --scalar-color-1: var(--foreground);
          --scalar-color-2: var(--muted-foreground);
          --scalar-color-3: var(--muted-foreground);
          --scalar-color-accent: var(--primary);
          --scalar-background-1: var(--card);
          --scalar-background-2: var(--background);
          --scalar-background-3: var(--muted);
          --scalar-background-accent: var(--accent);
          --scalar-border-color: var(--border);
        }
      `,
      };
    }, [apiKey, host, spec]);

  function saveSettings() {
    if (!hostState.value) return;
    setHostInput(hostState.value);
    window.localStorage.setItem(HOST_STORAGE_KEY, hostState.value);

    if (apiKey) {
      const storage = rememberApiKey ? window.localStorage : window.sessionStorage;
      storage.setItem(API_KEY_STORAGE_KEY, apiKey);
      if (rememberApiKey) window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
      else window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    } else {
      window.localStorage.removeItem(API_KEY_STORAGE_KEY);
      window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    }
    window.localStorage.setItem(REMEMBER_API_KEY_STORAGE_KEY, String(rememberApiKey));
    setSettingsSaved(true);
  }

  function forgetCredentials() {
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    window.localStorage.removeItem(REMEMBER_API_KEY_STORAGE_KEY);
    setApiKey('');
    setRememberApiKey(false);
    setSettingsSaved(false);
  }

  return (
    <DocsShell loaderData={docsData}>
      <DocsPage full>
        <main className="w-full max-w-full">
          <section className="mx-auto flex w-full flex-col gap-5 px-4 py-6">
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
              <div className="flex flex-col gap-5">
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    API Explorer
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight font-display md:text-4xl">
                    Explore your open-wa instance.
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    This page uses a static OpenAPI catalog from the docs site.
                    Set the base URL for the Easy API instance whose requests
                    you want to try; the instance must allow this docs origin
                    through CORS.
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                    Generated request examples use <code>447123456789@c.us</code> as a replacement recipient and <code>Hello from open-wa</code> as sample content. Replace both before sending.
                  </p>
                </div>

                <form className="grid w-full gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
                  <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-foreground">
                    Request base URL
                    <input
                      value={hostInput}
                      onChange={(event) => {
                        setHostInput(event.target.value);
                        setSettingsSaved(false);
                      }}
                      placeholder={DEFAULT_HOST}
                      aria-invalid={Boolean(hostState.error)}
                      className="min-h-11 rounded-[10px] border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span className="text-[13px] font-normal text-muted-foreground">
                      The explorer applies this base URL immediately and Save remembers it. Keep any supported path prefix, such as https://example.test/wa.
                    </span>
                    {hostState.error ? (
                      <span className="text-xs font-semibold text-destructive">{hostState.error}</span>
                    ) : null}
                  </label>
                  <div className="grid min-w-0 gap-1.5 text-sm font-semibold text-foreground">
                    <label htmlFor="api-explorer-key">API key</label>
                    <input
                      id="api-explorer-key"
                      value={apiKey}
                      onChange={(event) => {
                        setApiKey(event.target.value);
                        setSettingsSaved(false);
                      }}
                      type="password"
                      placeholder="Optional X-API-Key"
                      className="min-h-11 rounded-[10px] border border-input bg-background px-3 py-2 font-mono text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <label className="flex items-center gap-2 text-[13px] font-normal text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={rememberApiKey}
                        onChange={(event) => setRememberApiKey(event.target.checked)}
                      />
                      Remember on this device
                    </label>
                  </div>
                  <div className="flex justify-end md:col-span-2">
                    <button
                      type="button"
                      onClick={saveSettings}
                      className={cn(
                        buttonVariants({ variant: 'primary' }),
                        'min-h-11 w-full rounded-xl px-5 font-bold sm:w-auto',
                      )}
                    >
                      Save
                    </button>
                  </div>
                  {settingsSaved ? (
                    <p role="status" className="text-xs font-medium text-muted-foreground md:col-span-2">
                      Request base URL and credential preference saved for this browser.
                    </p>
                  ) : null}
                </form>
              </div>
              <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  By default, Save keeps the API key in this docs origin&apos;s sessionStorage for the current tab session. Choose Remember to store it in this browser profile&apos;s localStorage until you use Forget credentials.
                </p>
                <button type="button" onClick={forgetCredentials} className="font-bold text-primary underline underline-offset-2">
                  Forget credentials
                </button>
              </div>
              <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-[13px] text-muted-foreground">
                <p>
                  <span className="font-bold text-foreground">Catalog:</span>{' '}
                  {spec?.info?.version ?? 'loading'} from <code>{catalogOrigin || 'this docs site'}/openapi.json</code>. This catalog version comes from the document and may differ from the site&apos;s release label; it does not discover the selected instance&apos;s schema.
                </p>
                {host ? (
                  <p className="mt-1">
                    Effective request base: <code>{host}</code>. The instance&apos;s authoritative reference is{' '}
                    <a className="font-bold text-primary underline underline-offset-2" href={appendPath(host, '/api-docs/')} target="_blank" rel="noreferrer">
                      {appendPath(host, '/api-docs/')}
                    </a>
                    .
                  </p>
                ) : null}
              </div>
            </div>

            <div className="api-explorer-shell min-h-[720px] overflow-hidden rounded-2xl border border-border bg-card">
              {error ? (
                <div className="p-6 text-sm font-medium text-destructive">
                  {error}
                </div>
              ) : hostState.error ? (
                <div className="p-6 text-sm font-medium text-destructive">
                  Fix the request base URL above before using the explorer.
                </div>
              ) : configuration ? (
                <ApiReferenceReact configuration={configuration} />
              ) : (
                <div className="p-6 text-sm font-medium text-muted-foreground">
                  Loading OpenAPI schema...
                </div>
              )}
            </div>
          </section>
        </main>
      </DocsPage>
    </DocsShell>
  );
}
