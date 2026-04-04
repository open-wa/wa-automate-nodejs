import type { Config, HttpMethodDefinition } from '@open-wa/schema';
import { eventRegistry } from '@open-wa/schema';
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
          <td>${def.namespace}</td>
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
          <td><code>${def.meta.legacyName}</code></td>
          <td>${def.meta.namespace || 'core'}</td>
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
      <title>open-wa Easy API Explorer</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.5; }
        code { background: #f4f4f4; padding: 0.1rem 0.35rem; border-radius: 4px; }
        table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
        th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
        th { background: #fafafa; }
      </style>
    </head>
    <body>
      <h1>open-wa Easy API Explorer</h1>
      <p>Session: <strong>${config.sessionId}</strong></p>
      <p>Base URL: <code>${origin}${apiBasePath}</code></p>
      <p>
        <a href="${swaggerPath}">Swagger JSON</a> ·
        <a href="${postmanPath}">Postman Collection</a> ·
        <a href="${commandsPath}">Commands JSON</a> ·
        <a href="${listenersPath}">Listeners JSON</a>
      </p>
      <h2>Commands</h2>
      <table>
        <thead><tr><th>Method</th><th>Namespace</th><th>Description</th></tr></thead>
        <tbody>${commandRows}</tbody>
      </table>
      <h2>Listeners</h2>
      <table>
        <thead><tr><th>Event</th><th>Legacy Alias</th><th>Namespace</th><th>Description</th></tr></thead>
        <tbody>${listenerRows}</tbody>
      </table>
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
        namespace: def.namespace,
        description: def.description,
        path: def.path,
        parameterOrder: def.parameterOrder,
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
