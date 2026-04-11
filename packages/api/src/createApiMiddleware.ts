import { Hono } from 'hono';
import { getHttpMethodDefinitions, type HttpMethodDefinition } from '@open-wa/schema';
import '@open-wa/schema/methods';
import { apiKeyMiddleware } from './auth/api-key';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { normalizeMethodPayload } from './compat/args';
import { assertSessionPath } from './compat/session-path';
import { invokeClientMethod } from './invoke-client-method';
import type { ApiMiddlewareOptions, ClientMethodMap, ClientSource } from './types';

function resolveClient(clientSource: ClientSource): ClientMethodMap | undefined {
  return typeof clientSource === 'function' ? clientSource() : clientSource;
}

async function readRequestBody(c: any): Promise<Record<string, unknown>> {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}

function readQueryParams(c: any): Record<string, unknown> {
  const url = new URL(c.req.url);
  return Object.fromEntries(url.searchParams.entries());
}

function toLocalPath(path: string, basePath: string): string {
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/+$/, '');
  if (!normalizedBase) {
    return path || '/';
  }

  if (!path.startsWith(normalizedBase)) {
    return path || '/';
  }

  const stripped = path.slice(normalizedBase.length);
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

function createMethodMap(methodDefinitions: HttpMethodDefinition[]) {
  const entries: Array<[string, HttpMethodDefinition]> = [];
  for (const definition of methodDefinitions) {
    for (const name of definition.invocationNames) {
      entries.push([name, definition]);
    }
  }

  return new Map(entries);
}

function shouldBlockForLifecycle(options: ApiMiddlewareOptions): boolean {
  if (!options.isSessionConnected) {
    return false;
  }

  if (options.config.apiLifecycle === 'immediate') {
    return false;
  }

  return !options.isSessionConnected();
}

export function createApiMiddleware(clientSource: ClientSource, options: ApiMiddlewareOptions) {
  const app = new Hono();
  const basePath = options.basePath || '/api';
  const methodDefinitions = options.methodDefinitions || getHttpMethodDefinitions(basePath);
  const methods = createMethodMap(methodDefinitions);
  const useSessionIdInPath = options.useSessionIdInPath || false;

  app.use('/*', rateLimitMiddleware(100, 60000));

  if (options.config.apiKey) {
    app.use('/*', apiKeyMiddleware(options.config.apiKey));
  }

  const handleInvocation = async (
    c: any,
    routeMethod: string | undefined,
    routeSessionId?: string,
    routeDefinition?: HttpMethodDefinition,
  ) => {
    if (shouldBlockForLifecycle(options)) {
      return c.json({ error: 'API not available until the session is truly ready', status: 503 }, 503);
    }

    const sessionCheck = assertSessionPath(options.config.sessionId, routeSessionId, useSessionIdInPath);

    if (!sessionCheck.ok) {
      return c.json({ error: sessionCheck.error }, sessionCheck.status as any);
    }

    const startTime = Date.now();
    const query = readQueryParams(c);
    const body = c.req.method === 'GET' || c.req.method === 'DELETE' ? {} : await readRequestBody(c);
    const payload = { ...body, ...query };
    const methodName = routeMethod || routeDefinition?.functionName || (typeof payload.method === 'string' ? payload.method : undefined);

    if (!methodName) {
      return c.json({ error: 'Missing method name' }, 400);
    }

    const definition = routeDefinition || methods.get(methodName);

    if (!definition) {
      return c.json({ error: `Unknown method: ${methodName}` }, 404);
    }

    try {
      const normalizedPayload = normalizeMethodPayload(definition, payload);
      const validated = await definition.inputSchema.parseAsync(normalizedPayload);
      const result = await invokeClientMethod(resolveClient(clientSource), definition, validated);

      options.elasticEmitter?.log({
        level: 'info',
        component: 'api',
        method: methodName,
        sessionId: options.config.sessionId,
        duration: Date.now() - startTime,
        statusCode: 200,
        message: `Successfully executed ${methodName}`,
      });

      return c.json({ success: true, data: result });
    } catch (error: any) {
      options.elasticEmitter?.log({
        level: 'error',
        component: 'api',
        method: methodName,
        sessionId: options.config.sessionId,
        duration: Date.now() - startTime,
        statusCode: error?.name === 'ZodError' ? 400 : 500,
        message: error?.message || 'Internal Server Error',
      });

      if (error?.name === 'ZodError') {
        return c.json({ error: 'Validation Error', details: error.errors }, 400);
      }

      return c.json({ error: error?.message || 'Internal Server Error' }, 500);
    }
  };

  const redirectToCanonical = (definition: HttpMethodDefinition, c: any) => {
    c.header('X-OpenWA-Aliases', definition.routeSignatures.join(', '));
    const query = new URL(c.req.url).search;
    return c.redirect(`${definition.path}${query}`, 308);
  };

  for (const definition of methodDefinitions) {
    const localCanonicalPath = toLocalPath(definition.path, basePath);
    app.on(definition.httpMethod, localCanonicalPath, (c) =>
      handleInvocation(c, definition.functionName, undefined, definition),
    );

    for (const aliasRoute of definition.aliasRoutes) {
      const localAliasPath = toLocalPath(aliasRoute.path, basePath);
      app.on(definition.httpMethod, localAliasPath, (c) => redirectToCanonical(definition, c));
    }
  }

  app.post('/', (c) => handleInvocation(c, undefined));
  app.post('/:method', (c) => handleInvocation(c, c.req.param('method')));
  app.post('/:namespace/:method', (c) => handleInvocation(c, `${c.req.param('namespace')}.${c.req.param('method')}`));

  if (useSessionIdInPath) {
    app.post('/:sessionId', (c) => handleInvocation(c, undefined, c.req.param('sessionId')));
    app.post('/:sessionId/:method', (c) =>
      handleInvocation(c, c.req.param('method'), c.req.param('sessionId'))
    );
    app.post('/:sessionId/:namespace/:method', (c) =>
      handleInvocation(
        c,
        `${c.req.param('namespace')}.${c.req.param('method')}`,
        c.req.param('sessionId'),
      )
    );
  }

  app.get('/', (c) =>
    c.json({
      endpoints: methodDefinitions.map((def) => ({
        method: def.httpMethod,
        path: def.path,
        name: def.functionName,
        namespacedName: def.namespacedName,
        description: def.description,
        category: def.namespace,
        aliases: def.aliases,
        routeSignatures: def.routeSignatures,
      })),
    })
  );

  return app;
}
