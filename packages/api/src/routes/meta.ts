import type { Config, HttpMethodDefinition } from '@open-wa/schema';
import { eventRegistry } from '@open-wa/schema';
import { getMcpToolDefinitions } from '@open-wa/mcp';
import { deprecatedJson, applyDeprecationHeaders } from '../compat/deprecation';
import { createOpenApiDocument } from '../docs/openapi';
import { createPostmanCollection } from '../docs/postman';

function joinPath(...parts: string[]) {
  const normalized = parts
    .filter(Boolean)
    .map((part, index) => {
      if (index === 0) {
        return part.replace(/\/+$/, '');
      }

      return part.replace(/^\/+/, '').replace(/\/+$/, '');
    })
    .filter(Boolean)
    .join('/');

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function getExternalBase(c: any) {
  return c.req.header('x-openwa-external-base') || '';
}

function renderExplorerHtml(config: Config, methodDefinitions: HttpMethodDefinition[], origin: string, externalBase: string) {
  const commandRows = methodDefinitions
    .map(
      (def) => `
        <tr>
          <td><code>${def.functionName}</code></td>
          <td><span class="ns-badge">${def.namespace}</span></td>
          <td>${def.description}</td>
        </tr>`
    )
    .join('');

  const listenerRows = eventRegistry
    .getAll()
    .map(
      (def) => `
        <tr>
          <td><code>${def.meta.eventName}</code></td>
          <td><code class="legacy">${def.meta.legacyName}</code></td>
          <td><span class="ns-badge">${def.meta.namespace || 'core'}</span></td>
          <td>${def.meta.description || def.meta.eventName}</td>
        </tr>`
    )
    .join('');

  const swaggerPath = joinPath(externalBase, 'meta/swagger.json');
  const postmanPath = joinPath(externalBase, 'meta/postman.json');
  const commandsPath = joinPath(externalBase, 'meta/basic/commands');
  const listenersPath = joinPath(externalBase, 'meta/basic/listeners');
  const apiBasePath = joinPath(externalBase, 'api');

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>open-wa API Explorer — ${config.sessionId}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>
        :root {
          --bg: #faf6f0;
          --fg: #3e2723;
          --card: #ffffff;
          --muted: #efebe9;
          --muted-fg: #5d4037;
          --primary: #8d6e63;
          --border: #d7ccc8;
          --code-bg: #2d221e;
          --code-fg: #f5ebe6;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #2d221e;
            --fg: #f5ebe6;
            --card: #3e2f2a;
            --muted: #4e3b33;
            --muted-fg: #bcaaa4;
            --primary: #bcaaa4;
            --border: #4e3b33;
            --code-bg: #1e1614;
            --code-fg: #f5ebe6;
          }
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--bg);
          color: var(--fg);
          line-height: 1.6;
          min-height: 100vh;
          position: relative;
        }

        /* Dither texture overlay on body */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(var(--border) 20%, transparent 20%),
                            radial-gradient(var(--border) 20%, transparent 20%);
          background-size: 6px 6px;
          background-position: 0 0, 3px 3px;
          opacity: 0.08;
          pointer-events: none;
          z-index: 0;
        }

        .container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
          position: relative;
          z-index: 1;
        }

        /* Header card */
        .header-card {
          border: 2px solid var(--fg);
          border-radius: 1rem;
          background: var(--card);
          padding: 1.5rem 2rem;
          box-shadow: 4px 4px 0px 0px var(--fg);
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
        }
        .header-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(var(--border) 20%, transparent 20%),
                            radial-gradient(var(--border) 20%, transparent 20%);
          background-size: 6px 6px;
          background-position: 0 0, 3px 3px;
          opacity: 0.06;
          pointer-events: none;
        }

        h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 1.75rem;
          letter-spacing: -0.02em;
          position: relative;
        }
        h1 .emoji { font-size: 1.5rem; margin-right: 0.5rem; }

        .session-info {
          margin-top: 0.75rem;
          font-size: 0.875rem;
          color: var(--muted-fg);
          position: relative;
        }
        .session-info strong { color: var(--fg); font-weight: 600; }
        .session-info code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          background: var(--code-bg);
          color: var(--code-fg);
          padding: 0.15rem 0.5rem;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
        }

        /* Quick links */
        .quick-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
          position: relative;
        }
        .quick-links a {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 500;
          font-size: 0.8rem;
          text-decoration: none;
          color: var(--fg);
          background: var(--muted);
          border: 2px solid var(--fg);
          border-radius: 0.5rem;
          padding: 0.35rem 0.75rem;
          box-shadow: 2px 2px 0px 0px var(--fg);
          transition: all 0.15s ease;
        }
        .quick-links a:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px 0px var(--fg);
          background: var(--primary);
          color: var(--bg);
        }
        .quick-links a:active {
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0px 0px var(--fg);
        }

        /* Section headers */
        h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 1.25rem;
          margin: 2rem 0 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        h2 .count {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          font-weight: 500;
          background: var(--muted);
          color: var(--muted-fg);
          border: 1.5px solid var(--fg);
          border-radius: 2rem;
          padding: 0.1rem 0.5rem;
        }

        /* Table card */
        .table-card {
          border: 2px solid var(--fg);
          border-radius: 1rem;
          background: var(--card);
          box-shadow: 4px 4px 0px 0px var(--fg);
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        table { border-collapse: collapse; width: 100%; }

        thead {
          background: var(--muted);
          border-bottom: 2px solid var(--fg);
        }
        th {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.75rem 1rem;
          text-align: left;
          color: var(--fg);
        }

        td {
          padding: 0.625rem 1rem;
          font-size: 0.85rem;
          color: var(--muted-fg);
          border-bottom: 1px solid var(--border);
          vertical-align: top;
        }
        tr:last-child td { border-bottom: none; }
        tr:hover { background: color-mix(in srgb, var(--muted) 40%, transparent); }

        code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          background: var(--code-bg);
          color: var(--code-fg);
          padding: 0.1rem 0.4rem;
          border-radius: 0.35rem;
          border: 1px solid var(--border);
        }
        code.legacy {
          opacity: 0.6;
          font-size: 0.75rem;
        }

        .ns-badge {
          display: inline-block;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          background: var(--primary);
          color: var(--bg);
          border-radius: 0.35rem;
          padding: 0.1rem 0.5rem;
          text-transform: lowercase;
        }

        /* Search/filter input */
        .filter-bar {
          margin-bottom: 1rem;
        }
        .filter-bar input {
          width: 100%;
          max-width: 400px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          padding: 0.5rem 0.75rem;
          border: 2px solid var(--fg);
          border-radius: 0.75rem;
          background: var(--card);
          color: var(--fg);
          box-shadow: 2px 2px 0px 0px var(--fg);
          outline: none;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .filter-bar input:focus {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px 0px var(--fg);
        }
        .filter-bar input::placeholder { color: var(--muted-fg); opacity: 0.5; }

        @media (max-width: 640px) {
          .container { padding: 1rem; }
          .header-card { padding: 1rem 1.25rem; }
          h1 { font-size: 1.25rem; }
          .quick-links { flex-direction: column; }
          .quick-links a { justify-content: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header-card">
          <h1><span class="emoji">🧰</span> open-wa API Explorer</h1>
          <div class="session-info">
            Session: <strong>${config.sessionId}</strong> &middot;
            Base URL: <code>${origin}${apiBasePath}</code>
          </div>
          <div class="quick-links">
            <a href="${swaggerPath}">📋 Swagger JSON</a>
            <a href="${postmanPath}">📮 Postman Collection</a>
            <a href="${commandsPath}">⚡ Commands JSON</a>
            <a href="${listenersPath}">📡 Listeners JSON</a>
          </div>
        </div>

        <h2>⚡ Commands <span class="count">${methodDefinitions.length}</span></h2>
        <div class="filter-bar">
          <input type="text" id="cmd-filter" placeholder="Filter commands..." oninput="filterTable('cmd-table', this.value)" />
        </div>
        <div class="table-card">
          <table id="cmd-table">
            <thead><tr><th>Method</th><th>Namespace</th><th>Description</th></tr></thead>
            <tbody>${commandRows}</tbody>
          </table>
        </div>

        <h2>📡 Listeners <span class="count">${eventRegistry.getAll().length}</span></h2>
        <div class="filter-bar">
          <input type="text" id="evt-filter" placeholder="Filter listeners..." oninput="filterTable('evt-table', this.value)" />
        </div>
        <div class="table-card">
          <table id="evt-table">
            <thead><tr><th>Event</th><th>Legacy Alias</th><th>Namespace</th><th>Description</th></tr></thead>
            <tbody>${listenerRows}</tbody>
          </table>
        </div>
      </div>
      <script>
        function filterTable(tableId, query) {
          var table = document.getElementById(tableId);
          var rows = table.querySelectorAll('tbody tr');
          var q = query.toLowerCase();
          rows.forEach(function(row) {
            row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
          });
        }
      </script>
    </body>
  </html>`;
}

export function registerMetaRoutes(
  app: any,
  options: { config: Config; methodDefinitions: HttpMethodDefinition[] }
) {
  app.get('/', (c: any) => c.redirect('/api-docs/'));
  app.get('/api-docs', (c: any) => c.redirect('/api-docs/'));
  app.get('/api-docs/', (c: any) => {
    const origin = new URL(c.req.url).origin;
    const externalBase = getExternalBase(c);
    return c.html(renderExplorerHtml(options.config, options.methodDefinitions, origin, externalBase));
  });

  app.get('/meta/swagger.json', (c: any) => {
    const origin = new URL(c.req.url).origin;
    const basePath = joinPath(getExternalBase(c), 'api');
    return c.json(createOpenApiDocument(options.methodDefinitions, { origin, basePath }));
  });

  app.get('/meta/postman.json', (c: any) => {
    const origin = new URL(c.req.url).origin;
    const basePath = joinPath(getExternalBase(c), 'api');
    return c.json(createPostmanCollection(options.methodDefinitions, { origin, basePath }));
  });

  app.get('/meta/basic/commands', (c: any) => {
    return c.json(
      options.methodDefinitions.map((def) => ({
        method: def.functionName,
        namespacedName: def.namespacedName,
        namespace: def.namespace,
        description: def.description,
        path: def.path,
        parameterOrder: def.parameterOrder,
        aliases: def.aliases,
        aliasRoutes: def.aliasRoutes,
        routeSignatures: def.routeSignatures,
      }))
    );
  });

  app.get('/meta/basic/listeners', (c: any) => {
    return c.json(
      eventRegistry.getAll().map((def) => ({
        eventName: def.meta.eventName,
        legacyName: def.meta.legacyName,
        namespace: def.meta.namespace,
        description: def.meta.description,
        status: def.meta.status,
      }))
    );
  });

  if (options.config.mcp?.exposeToolsMeta) {
    app.get('/meta/mcp-tools.json', (c: any) => {
      return c.json({
        endpoint: options.config.mcp?.path || '/mcp',
        requiresApiKey: true,
        tools: getMcpToolDefinitions(),
      });
    });
  }

  app.get('/swagger-stats', (c: any) => {
    applyDeprecationHeaders(c, {
      route: '/swagger-stats',
      message: 'swagger-stats is not carried forward in v5.',
      replacement: '/api-docs/',
    });
    return c.redirect('/api-docs/');
  });

  app.get('/swagger-stats/', (c: any) => {
    applyDeprecationHeaders(c, {
      route: '/swagger-stats/',
      message: 'swagger-stats is not carried forward in v5.',
      replacement: '/api-docs/',
    });
    return c.redirect('/api-docs/');
  });

  app.post('/meta/codegen/:language', (c: any) => {
    const language = c.req.param('language');
    return deprecatedJson(
      c,
      {
        route: '/meta/codegen/:language',
        message: 'Runtime codegen is no longer generated inline by the Easy API server.',
        replacement: '/meta/swagger.json or /meta/postman.json',
      },
      410,
      {
        language,
        availableArtifacts: ['/meta/swagger.json', '/meta/postman.json'],
      }
    );
  });

  app.post('/meta/process/exit', (c: any) =>
    deprecatedJson(
      c,
      {
        route: '/meta/process/exit',
        message: 'Process-control endpoints are not exposed by the shared v5 API runtime.',
        replacement: 'external process manager controls',
      },
      410
    )
  );

  app.post('/meta/process/restart', (c: any) =>
    deprecatedJson(
      c,
      {
        route: '/meta/process/restart',
        message: 'Process-control endpoints are not exposed by the shared v5 API runtime.',
        replacement: 'external process manager controls',
      },
      410
    )
  );

  app.post('/disengage', (c: any) =>
    deprecatedJson(
      c,
      {
        route: '/disengage',
        message: 'The disengage route is deprecated in the shared v5 API runtime.',
        replacement: '/meta/process/restart or external orchestration controls',
      },
      410
    )
  );
}
