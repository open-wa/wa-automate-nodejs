import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { getHttpMethodDefinitions } from '../src/http-manifest';
import '../src/methods';

const generatedDir = path.join(fileURLToPath(new URL('.', import.meta.url)), '../src/generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

function schemaToOpenApi(schema: { toJSONSchema?: (params?: unknown) => unknown }) {
  if (typeof schema?.toJSONSchema === 'function') {
    return schema.toJSONSchema({ target: 'openapi-3.0' });
  }

  return { type: 'object', additionalProperties: true };
}

function buildQueryParameters(def: ReturnType<typeof getHttpMethodDefinitions>[number]) {
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

const methods = getHttpMethodDefinitions();

const document = {
  openapi: '3.0.3',
  info: {
    title: 'Open WA API',
    version: '5.0.0',
    description: 'API definition for Open WA v5',
  },
  servers: [
    {
      url: 'http://localhost:3000',
    },
  ],
  paths: methods.reduce<Record<string, any>>((paths, def) => {
    paths[def.path] = {
      [def.httpMethod.toLowerCase()]: {
        tags: [def.namespace],
        operationId: def.functionName,
        summary: def.description,
        description: def.description,
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
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: schemaToOpenApi(def.outputSchema),
              },
            },
          },
          400: {
            description: 'Validation error',
          },
          500: {
            description: 'Internal server error',
          },
        },
      },
    };

    return paths;
  }, {}),
};

fs.writeFileSync(path.join(generatedDir, 'openapi.json'), JSON.stringify(document, null, 2));

console.log(`Successfully generated openapi.json with ${methods.length} methods`);
