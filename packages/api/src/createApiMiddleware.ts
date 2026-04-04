import { Hono } from 'hono';
import { z, getHttpMethodDefinitions, type HttpMethodDefinition } from '@open-wa/schema';
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

function createMethodMap(methodDefinitions: HttpMethodDefinition[]) {
  return new Map(methodDefinitions.map((definition) => [definition.functionName, definition]));
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
  const methodDefinitions = options.methodDefinitions || getHttpMethodDefinitions(options.basePath || '/api');
  const methods = createMethodMap(methodDefinitions);
  const useSessionIdInPath = options.useSessionIdInPath || false;

  app.use('/*', rateLimitMiddleware(100, 60000));

  if (options.config.apiKey) {
    app.use('/*', apiKeyMiddleware(options.config.apiKey));
  }

  const handleInvocation = async (c: any, routeMethod: string | undefined, routeSessionId?: string) => {
    if (shouldBlockForLifecycle(options)) {
      return c.json({ error: 'API not available until the session is truly ready', status: 503 }, 503);
    }

    const sessionCheck = assertSessionPath(options.config.sessionId, routeSessionId, useSessionIdInPath);

    if (!sessionCheck.ok) {
      return c.json({ error: sessionCheck.error }, sessionCheck.status as any);
    }

    const startTime = Date.now();
    const body = await readRequestBody(c);
    const methodName = routeMethod || (typeof body.method === 'string' ? body.method : undefined);

    if (!methodName) {
      return c.json({ error: 'Missing method name' }, 400);
    }

    const definition = methods.get(methodName);

    if (!definition) {
      return c.json({ error: `Unknown method: ${methodName}` }, 404);
    }

    try {
      const normalizedPayload = normalizeMethodPayload(definition, body);
      const validated = definition.inputSchema.parse(normalizedPayload);
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

  app.post('/', (c) => handleInvocation(c, undefined));
  app.post('/:method', (c) => handleInvocation(c, c.req.param('method')));

  if (useSessionIdInPath) {
    app.post('/:sessionId', (c) => handleInvocation(c, undefined, c.req.param('sessionId')));
    app.post('/:sessionId/:method', (c) =>
      handleInvocation(c, c.req.param('method'), c.req.param('sessionId'))
    );
  }

  app.get('/', (c) =>
    c.json({
      endpoints: methodDefinitions.map((def) => ({
        method: 'POST',
        path: def.path,
        name: def.functionName,
        description: def.description,
        category: def.namespace,
      })),
    })
  );

  return app;
}
