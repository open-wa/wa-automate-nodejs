import { Schema } from 'effect';
import { z } from 'zod';

type JsonSchema = { $ref?: string; type?: string; const?: unknown; enum?: unknown[]; anyOf?: JsonSchema[]; oneOf?: JsonSchema[]; properties?: Record<string, JsonSchema>; required?: string[]; items?: JsonSchema; additionalProperties?: boolean | JsonSchema };

/** A focused projection of calling contracts into the currently serving registry. */
export function projectEffectSchema(schema: Schema.Top): z.ZodType {
  // Effect's empty Struct accepts object-like values; registry input metadata
  // represents its named fields as an object and positional calls as a tuple.
  if ('fields' in schema && Object.keys(schema.fields as object).length === 0) return z.object({});
  const document = Schema.toJsonSchemaDocument(schema);
  const project = (node: JsonSchema): z.ZodType => {
    if (node.$ref) {
      const key = node.$ref.split('/').at(-1)!;
      return project(document.definitions[key] as JsonSchema);
    }
    if ('const' in node) return z.literal(node.const as string | number | boolean | null);
    if (node.enum) return z.union(node.enum.map(value => z.literal(value as string | number | boolean | null)));
    const members = node.anyOf ?? node.oneOf;
    if (members) return z.union(members.map(project));
    switch (node.type) {
      case 'string': return z.string();
      case 'number': return z.number();
      case 'integer': return z.number().int();
      case 'boolean': return z.boolean();
      case 'null': return z.null();
      case 'array': return z.array(project(node.items ?? {}));
      case 'object': {
        const properties = node.properties ?? {};
        const values = typeof node.additionalProperties === 'object' ? project(node.additionalProperties) : node.additionalProperties ? z.unknown() : undefined;
        if (!Object.keys(properties).length && values) return z.record(z.string(), values);
        const required = new Set(node.required ?? []);
        const object = z.object(Object.fromEntries(Object.entries(properties).map(([key, value]) => {
          const field = project(value);
          return [key, required.has(key) ? field : field.optional()];
        })));
        return values ? object.catchall(values) : object;
      }
      default: return z.unknown();
    }
  };
  return project(document.schema as JsonSchema);
}
