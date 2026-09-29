import { successResponseSchema } from '@open-wa/schema';
import type { HttpMethodDefinition } from '@open-wa/schema';
import { API_VERSION } from '../version';

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
                  schema: successResponseSchema(def.outputSchema),
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['error', 'details'],
                  properties: {
                    error: { type: 'string', enum: ['Validation Error'] },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['code', 'path', 'message'],
                        properties: {
                          code: { type: 'string' },
                          path: { type: 'array', items: { oneOf: [{ type: 'string' }, { type: 'integer' }] } },
                          message: { type: 'string' },
                        },
                        additionalProperties: true,
                      },
                    },
                  },
                  additionalProperties: false,
                },
                examples: {
                  validationError: {
                    summary: 'Input validation failed',
                    value: { error: 'Validation Error', details: [{ code: 'invalid_type', path: ['to'], message: 'Invalid input' }] },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['error'],
                  properties: { error: { type: 'string' } },
                  additionalProperties: false,
                },
                examples: {
                  internalError: {
                    summary: 'Execution failed',
                    value: { error: 'Internal Server Error' },
                  },
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
      version: options.version || API_VERSION,
    },
    servers: [{ url: options.origin }],
    paths,
  };
}
