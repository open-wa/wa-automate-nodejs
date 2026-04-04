import type { HttpMethodDefinition } from '@open-wa/schema';

export function createPostmanCollection(
  methodDefinitions: HttpMethodDefinition[],
  options: { origin: string; basePath?: string; name?: string }
) {
  const basePath = options.basePath || '/api';

  return {
    info: {
      name: options.name || 'open-wa Easy API',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      {
        key: 'baseUrl',
        value: `${options.origin}${basePath}`.replace(/\/api\/api$/, '/api'),
      },
    ],
    item: methodDefinitions.map((def) => ({
      name: def.functionName,
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        url: {
          raw: `{{baseUrl}}/${def.functionName}`,
          host: ['{{baseUrl}}'],
          path: [def.functionName],
        },
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            Object.fromEntries(def.parameterOrder.map((name) => [name, `<${name}>`])),
            null,
            2
          ),
        },
        description: def.description,
      },
    })),
  };
}
