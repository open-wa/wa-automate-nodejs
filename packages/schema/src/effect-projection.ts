import { Schema } from 'effect';
import { z } from 'zod';

type JsonSchema = { $ref?: string; type?: string; const?: unknown; enum?: unknown[]; anyOf?: JsonSchema[]; oneOf?: JsonSchema[]; allOf?: JsonSchema[]; properties?: Record<string, JsonSchema>; required?: string[]; items?: JsonSchema; additionalProperties?: boolean | JsonSchema; minimum?: number; maximum?: number; exclusiveMinimum?: number; exclusiveMaximum?: number; minLength?: number; maxLength?: number; pattern?: string; format?: string; title?: string; description?: string; examples?: unknown[] };
export type SyncEffectSchema = Schema.Top & Schema.ConstraintCodec<unknown, unknown>;

/** JSON Schema is presentation metadata; Effect remains the validation/codec authority. */
function projectDocument(document: ReturnType<typeof Schema.toJsonSchemaDocument>): z.ZodType {
  const project = (node: JsonSchema): z.ZodType => {
    let value: z.ZodType;
    if (node.allOf) {
      const { allOf, ...base } = node;
      value = project(base);
      for (const clause of allOf) {
        const metadataOnly = Object.keys(clause).every(key => ['title', 'description', 'examples', 'format'].includes(key));
        value = metadataOnly ? value.meta(clause) : z.intersection(value, project({ type: node.type, ...clause }));
      }
    } else if (node.$ref) {
      const key = node.$ref.split('/').at(-1)!;
      value = project(document.definitions[key] as JsonSchema);
    } else if ('const' in node) value = z.literal(node.const as string | number | boolean | null);
    else if (node.enum) value = z.union(node.enum.map(item => z.literal(item as string | number | boolean | null)));
    else if (node.anyOf ?? node.oneOf) value = z.union((node.anyOf ?? node.oneOf)!.map(project));
    else switch (node.type) {
      case 'string': {
        let string = z.string();
        if (node.minLength !== undefined) string = string.min(node.minLength);
        if (node.maxLength !== undefined) string = string.max(node.maxLength);
        if (node.pattern !== undefined) string = string.regex(new RegExp(node.pattern));
        value = string;
        break;
      }
      case 'number':
      case 'integer': {
        let number = node.type === 'integer' ? z.number().int() : z.number();
        if (node.minimum !== undefined) number = number.min(node.minimum);
        if (node.maximum !== undefined) number = number.max(node.maximum);
        if (node.exclusiveMinimum !== undefined) number = number.gt(node.exclusiveMinimum);
        if (node.exclusiveMaximum !== undefined) number = number.lt(node.exclusiveMaximum);
        value = number;
        break;
      }
      case 'boolean': value = z.boolean(); break;
      case 'null': value = z.null(); break;
      case 'array': value = z.array(project(node.items ?? {})); break;
      case 'object': {
        const properties = node.properties ?? {};
        const values = typeof node.additionalProperties === 'object' ? project(node.additionalProperties) : node.additionalProperties ? z.unknown() : undefined;
        if (!Object.keys(properties).length && values) { value = z.record(z.string(), values); break; }
        const required = new Set(node.required ?? []);
        const object = z.object(Object.fromEntries(Object.entries(properties).map(([key, field]) => {
          const property = project(field);
          return [key, required.has(key) ? property : property.optional()];
        })));
        value = values ? object.catchall(values) : object;
        break;
      }
      default: value = z.unknown();
    }
    const { title, description, examples, format } = node;
    return value.meta({ ...(title ? { title } : {}), ...(description ? { description } : {}), ...(examples ? { examples } : {}), ...(format ? { format } : {}) });
  };
  return project(document.schema as JsonSchema);
}

/** Project synchronous Effect contracts into the method/listener/OpenUI registry. */
export function projectEffectSchema<S extends SyncEffectSchema>(schema: S): z.ZodType<S['Type'], S['Encoded']> {
  const decoded = Schema.toType(schema);
  const encoded = Schema.toEncoded(schema);
  // Keep Struct.shape for the serving registry, while field codecs perform their
  // real transformations and decoded Struct checks remain authoritative.
  if ('fields' in schema) {
    const fields = schema.fields as Record<string, SyncEffectSchema>;
    const shape = Object.fromEntries(Object.entries(fields).map(([name, field]) => {
      const optional = field.ast.context?.isOptional === true;
      const hasUndefined = field.ast._tag === 'Union' && field.ast.types.some(member => member._tag === 'Undefined');
      const valueSchema = !optional ? field : hasUndefined
        ? Schema.required(field as Schema.optional<SyncEffectSchema>)
        : Schema.requiredKey(field as Schema.optionalKey<SyncEffectSchema>);
      const value = projectEffectSchema(valueSchema);
      return [name, optional ? value.optional() : value];
    }));
    return z.object(shape).superRefine((value, ctx) => {
      try { Schema.decodeUnknownSync(decoded)(value); }
      catch (error) { ctx.addIssue({ code: 'custom', message: String(error) }); }
    }).meta(Schema.resolveAnnotations(schema) ?? {}) as z.ZodType<S['Type'], S['Encoded']>;
  }
  // Identity schemas need Effect's checks but no transformation wrapper. This
  // retains native Zod kinds and input examples for registry documentation.
  if (encoded.ast === decoded.ast) {
    return projectDocument(Schema.toJsonSchemaDocument(schema)).superRefine((value, ctx) => {
      try { Schema.decodeUnknownSync(schema)(value); }
      catch (error) { ctx.addIssue({ code: 'custom', message: String(error) }); }
    }).meta(Schema.resolveAnnotations(schema) ?? {}) as z.ZodType<S['Type'], S['Encoded']>;
  }
  return z.codec(
    projectDocument(Schema.toJsonSchemaDocument(encoded)),
    projectDocument(Schema.toJsonSchemaDocument(decoded)),
    {
      decode: (value, ctx) => {
        try { return Schema.decodeUnknownSync(schema)(value); }
        catch (error) { ctx.issues.push({ code: 'custom', input: value, message: String(error) }); return z.NEVER; }
      },
      encode: (value, ctx) => {
        try { return Schema.encodeSync(schema)(Schema.decodeUnknownSync(decoded)(value)); }
        catch (error) { ctx.issues.push({ code: 'custom', input: value, message: String(error) }); return z.NEVER; }
      },
    },
  ) as z.ZodType<S['Type'], S['Encoded']>;
}
