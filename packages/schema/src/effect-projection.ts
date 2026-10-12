import { Schema } from 'effect';
import { z } from 'zod';

type JsonSchema = { $ref?: string; type?: string; const?: unknown; enum?: unknown[]; anyOf?: JsonSchema[]; oneOf?: JsonSchema[]; properties?: Record<string, JsonSchema>; required?: string[]; items?: JsonSchema; additionalProperties?: boolean | JsonSchema; minimum?: number; maximum?: number; exclusiveMinimum?: number; exclusiveMaximum?: number; minLength?: number; maxLength?: number };

/** Project Effect contracts into the serving method and listener registry. */
export function projectEffectSchema<S extends Schema.Top>(schema: S): z.ZodType<S['Type'], S['Encoded']> {
  // JSON codec generation maps undefined to null. Project Struct fields from
  // their original schemas so optional properties retain their JS semantics.
  if ('fields' in schema) {
    const fields = schema.fields as Record<string, Schema.Top>;
    const shape = Object.fromEntries(Object.entries(fields).map(([name, field]) => {
      const optional = field.ast.context?.isOptional === true;
      const hasUndefined = field.ast._tag === 'Union' && field.ast.types.some(member => member._tag === 'Undefined');
      const valueSchema = !optional ? field : hasUndefined
        ? Schema.required(field as Schema.optional<Schema.Top>)
        : Schema.requiredKey(field as Schema.optionalKey<Schema.Top>);
      const value = projectEffectSchema(valueSchema);
      return [name, optional ? value.optional() : value];
    }));
    return z.object(shape) as z.ZodType<S['Type'], S['Encoded']>;
  }
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
      case 'string': {
        let value = z.string();
        if (node.minLength !== undefined) value = value.min(node.minLength);
        if (node.maxLength !== undefined) value = value.max(node.maxLength);
        return value;
      }
      case 'number':
      case 'integer': {
        let value = node.type === 'integer' ? z.number().int() : z.number();
        if (node.minimum !== undefined) value = value.min(node.minimum);
        if (node.maximum !== undefined) value = value.max(node.maximum);
        if (node.exclusiveMinimum !== undefined) value = value.gt(node.exclusiveMinimum);
        if (node.exclusiveMaximum !== undefined) value = value.lt(node.exclusiveMaximum);
        return value;
      }
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
  return project(document.schema as JsonSchema) as z.ZodType<S['Type'], S['Encoded']>;
}
