import fs from 'fs';
import path from 'path';
import { getHttpMethodDefinitions } from '../src/http-manifest';
import '../src/methods';

import { fileURLToPath } from "node:url";
const generatedDir = path.join(fileURLToPath(new URL(".", import.meta.url)), '../src/generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

type OpenApiSchema = {
  type?: string;
  description?: string;
  enum?: Array<string | number | boolean | null>;
  items?: OpenApiSchema;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  additionalProperties?: boolean;
  nullable?: boolean;
  oneOf?: OpenApiSchema[];
};

const methods = getHttpMethodDefinitions();

const toOpenApiSchema = (schema: any): OpenApiSchema => {
  const definition = schema?._def;
  const typeName = definition?.typeName ?? definition?.type;
  const description = schema?.description;

  switch (typeName) {
    case 'string':
    case 'ZodString':
      return { type: 'string', description };
    case 'number':
    case 'ZodNumber':
      return { type: 'number', description };
    case 'boolean':
    case 'ZodBoolean':
      return { type: 'boolean', description };
    case 'array':
    case 'ZodArray': {
      const itemType = schema.element ?? definition?.type;
      return { type: 'array', description, items: toOpenApiSchema(itemType) };
    }
    case 'object':
    case 'ZodObject': {
      const shape = typeof schema?.shape === 'function' ? schema.shape : schema?.shape ?? {};
      const properties: Record<string, OpenApiSchema> = {};
      const required: string[] = [];

      Object.entries(shape).forEach(([key, value]) => {
        properties[key] = toOpenApiSchema(value as any);
        const valueType = (value as any)?._def?.typeName ?? (value as any)?._def?.type;
        if (valueType !== 'optional' && valueType !== 'ZodOptional' && valueType !== 'default' && valueType !== 'ZodDefault') {
          required.push(key);
        }
      });

      return {
        type: 'object',
        description,
        properties,
        required: required.length > 0 ? required : undefined,
        additionalProperties: false,
      };
    }
    case 'enum':
    case 'ZodEnum':
      return { type: 'string', description, enum: Array.from(schema?.options ?? []) as Array<string | number | boolean | null> };
    case 'literal':
    case 'ZodLiteral': {
      const value = schema?.value;
      const literalType = value === null ? 'string' : typeof value;
      return { type: literalType === 'object' ? 'string' : literalType, description, enum: [value as any], nullable: value === null };
    }
    case 'union':
    case 'ZodUnion': {
      const options = definition?.options ?? [];
      return { description, oneOf: options.map((option: any) => toOpenApiSchema(option)) };
    }
    case 'optional':
    case 'ZodOptional': {
      const innerType = schema?.unwrap?.() ?? definition?.innerType;
      return toOpenApiSchema(innerType);
    }
    case 'nullable':
    case 'ZodNullable': {
      const innerType = schema?.unwrap?.() ?? definition?.innerType;
      return { ...toOpenApiSchema(innerType), nullable: true };
    }
    case 'default':
    case 'ZodDefault': {
      const innerType = definition?.innerType;
      return toOpenApiSchema(innerType);
    }
    case 'transform':
    case 'ZodEffects':
    case 'ZodTransform': {
      const innerType = definition?.schema ?? definition?.innerType;
      return toOpenApiSchema(innerType);
    }
    case 'void':
    case 'ZodVoid':
      return { type: 'object', description, properties: {}, additionalProperties: false };
    default:
      return { type: 'object', description, additionalProperties: true };
  }
};

const document = {
  openapi: '3.0.0',
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
    const methodName = def.functionName;
    const routePath = def.path;
    const inputSchema = def.inputSchema;
    const outputSchema = def.outputSchema;

    paths[routePath] = {
      post: {
        tags: [def.namespace],
        operationId: methodName,
        summary: def.description,
        description: def.description,
        requestBody: {
          required: def.parameterOrder.length > 0,
          content: {
            'application/json': {
              schema: toOpenApiSchema(inputSchema),
            },
          },
        },
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: toOpenApiSchema(outputSchema),
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
