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
import { source } from '@/lib/source';
import { DocsPage } from 'fumadocs-ui/layouts/notebook/page';

const DEFAULT_HOST = 'http://localhost:8080';
const HOST_STORAGE_KEY = 'openwa.docs.apiExplorer.host';
const API_KEY_STORAGE_KEY = 'openwa.docs.apiExplorer.apiKey';

type OpenApiDocument = Record<string, unknown> & {
  servers?: Array<Record<string, unknown>>;
};

const pageTreeLoader = createServerFn({
  method: 'GET',
}).handler(async () => ({
  pageTree: await source.serializePageTree(source.pageTree),
}));

export const Route = createFileRoute('/api-explorer')({
  component: ApiExplorerPage,
  loader: () => pageTreeLoader(),
});

function normalizeHost(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_HOST;

  try {
    return new URL(trimmed).origin;
  } catch {
    return DEFAULT_HOST;
  }
}

function withServer(spec: OpenApiDocument, host: string): OpenApiDocument {
  return {
    ...spec,
    servers: [{ url: normalizeHost(host) }],
  };
}

function ApiExplorerPage() {
  const docsData = Route.useLoaderData();
  const [hostInput, setHostInput] = React.useState(DEFAULT_HOST);
  const [apiKey, setApiKey] = React.useState('');
  const [spec, setSpec] = React.useState<OpenApiDocument | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedHost = window.localStorage.getItem(HOST_STORAGE_KEY);
    const storedApiKey = window.localStorage.getItem(API_KEY_STORAGE_KEY);

    if (storedHost) setHostInput(storedHost);
    if (storedApiKey) setApiKey(storedApiKey);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    fetch('/openapi.json')
      .then((response) => {
        if (!response.ok) throw new Error(`OpenAPI spec returned ${response.status}`);
        return response.json() as Promise<OpenApiDocument>;
      })
      .then((document) => {
        if (!cancelled) setSpec(document);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load OpenAPI spec');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const host = normalizeHost(hostInput);
  const configuration = React.useMemo<AnyApiReferenceConfiguration | null>(() => {
    if (!spec) return null;

    return {
      content: withServer(spec, host),
      theme: 'none',
      layout: 'classic',
      hideDarkModeToggle: true,
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
        }
      `,
    };
  }, [apiKey, host, spec]);

  function saveSettings() {
    const normalized = normalizeHost(hostInput);
    setHostInput(normalized);
    window.localStorage.setItem(HOST_STORAGE_KEY, normalized);

    if (apiKey) {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    } else {
      window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }

  return (
    <DocsShell loaderData={docsData}>
      <DocsPage full>
        <main className="w-full max-w-full">
          <section className="mx-auto flex w-full flex-col gap-5 px-4 py-6">
            <div className="rounded-3xl border-backstitch bg-card p-5 shadow-stipple md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    API Explorer
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight font-display md:text-4xl">
                    Explore your open-wa instance.
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Enter the host for the Easy API instance you want to test. Requests run from your browser, so the instance must allow this docs origin through CORS.
                  </p>
                </div>

                <form
                  className="grid w-full gap-3 lg:max-w-2xl lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)_auto]"
                >
                  <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                    Instance host
                    <input
                      value={hostInput}
                      onChange={(event) => setHostInput(event.target.value)}
                      placeholder={DEFAULT_HOST}
                      className="min-h-11 rounded-xl border-2 border-foreground bg-background px-3 py-2 font-mono text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                    API key
                    <input
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      type="password"
                      placeholder="Optional X-API-Key"
                      className="min-h-11 rounded-xl border-2 border-foreground bg-background px-3 py-2 font-mono text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={saveSettings}
                    className={cn(
                      buttonVariants({ variant: 'primary' }),
                      'min-h-11 self-end rounded-xl px-5 font-bold',
                    )}
                  >
                    Save
                  </button>
                </form>
              </div>
            </div>

            <div className="api-explorer-shell min-h-[720px] overflow-hidden rounded-3xl border-backstitch bg-card shadow-stipple">
              {error ? (
                <div className="p-6 text-sm font-medium text-destructive">{error}</div>
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
