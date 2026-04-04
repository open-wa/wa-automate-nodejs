import type { HttpMethodDefinition } from '@open-wa/schema';

export function createOpenApiDocument(
  methodDefinitions: HttpMethodDefinition[],
  options: { origin: string; basePath?: string; title?: string; version?: string }
) {
  const basePath = options.basePath || '/api';
  const paths = Object.fromEntries(
    methodDefinitions.map((def) => [
      `${basePath}/${def.functionName}`,
      {
        post: {
          summary: def.description,
          operationId: def.functionName,
          tags: [def.namespace],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: Object.fromEntries(
                    def.parameterOrder.map((name) => [name, { description: `Argument: ${name}` }])
                  ),
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Successful response',
            },
          },
        },
      },
    ])
  );

  return {
    openapi: '3.0.3',
    info: {
      title: options.title || 'open-wa Easy API',
      version: options.version || '5.0.0',
    },
    servers: [{ url: `${options.origin}${basePath}`.replace(/\/api\/api$/, '/api') }],
    paths,
  };
}
