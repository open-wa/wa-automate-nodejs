import type { HttpMethodDefinition } from '@open-wa/schema';

function schemaToOpenApi(schema: { toJSONSchema?: (params?: unknown) => unknown }) {
  if (typeof schema?.toJSONSchema === 'function') {
    return schema.toJSONSchema({ target: 'openapi-3.0' });
  }

  return { type: 'object', additionalProperties: true };
}

function buildQueryParameters(def: HttpMethodDefinition) {
  const inputSchema = schemaToOpenApi(def.inputSchema) as {
    properties?: Record<string, Record<string, unknown>>;
    required?: string[];
  };
  const properties = inputSchema.properties ?? {};
  const required = new Set(inputSchema.required ?? []);

  return def.parameterOrder.map((name) => ({
    name,
    in: 'query',
    required: required.has(name),
    description: properties[name]?.description || `Argument: ${name}`,
    schema: properties[name] || { type: 'string' },
  }));
}

export function createOpenApiDocument(
  methodDefinitions: HttpMethodDefinition[],
  options: { origin: string; basePath?: string; title?: string; version?: string }
) {
  const paths = Object.fromEntries(
    methodDefinitions.map((def) => [
      def.path,
      {
        [def.httpMethod.toLowerCase()]: {
          summary: def.description,
          operationId: def.functionName,
          tags: [def.namespace],
          ...(def.httpMethod === 'GET' || def.httpMethod === 'DELETE'
            ? { parameters: buildQueryParameters(def) }
            : {
                requestBody: {
                  required: def.parameterOrder.length > 0,
                  content: {
                    'application/json': {
                      schema: schemaToOpenApi(def.inputSchema),
                    },
                  },
                },
              }),
          'x-openwa-aliases': def.routeSignatures.filter((signature) => signature !== `${def.httpMethod} ${def.path}`),
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: schemaToOpenApi(def.outputSchema),
                },
              },
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
    servers: [{ url: options.origin }],
    paths,
  };
}
