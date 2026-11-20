import { z } from 'zod';
import * as common from '../src/common-types';
import * as returns from '../src/return-types';
import * as interactive from '../src/interactive';
import * as mediaOptions from '../src/media-options';
import * as polls from '../src/polls';
import * as eventProjections from '../src/whatsapp-event-registry';
import { SendTextResultSchema, AlbumMediaSchema, AlbumSendResultSchema } from '../src/methods/messaging';

export const namedSchemas = Object.fromEntries(
  [...Object.entries(common), ...Object.entries(returns),
    ...Object.entries(interactive).map(([name, schema]) => [name.replace('RegistrySchema', 'Schema'), schema]),
    ...Object.entries(mediaOptions), ...Object.entries(polls),
    ...Object.entries({ AlbumMediaSchema, AlbumSendResultSchema }),
    ...Object.entries(eventProjections).map(([name, schema]) => [name.replace('RegistrySchema', 'Schema'), schema])]
    .filter(([name, value]) => name.endsWith('Schema') && value instanceof z.ZodType)
    .map(([name, value]) => [name.replace(/Schema$/, ''), value as z.ZodType]),
);
const names = new Map(Object.entries(namedSchemas).map(([name, schema]) => [schema, name]));
names.set(SendTextResultSchema, 'MessageId');
// `.describe()` clones a schema but keeps its object shape, so a described copy
// of a named object (such as a `message` parameter) still reads as that name.
// Built on first use, after every schema module has loaded. Built at import
// time, it missed the described copies the method modules create later.
let namesByShape: Map<unknown, string> | undefined;

function schemaName(schema: z.ZodType): string | undefined {
  const def = schema._zod.def as any;
  const exact = names.get(schema);
  if (exact || def.type !== 'object') return exact;
  namesByShape ??= new Map(Object.entries(namedSchemas)
    .filter(([, named]) => named._zod.def.type === 'object')
    .map(([name, named]) => [(named._zod.def as any).shape, name]));
  return namesByShape.get(def.shape);
}

/** The documented name of a schema, unwrapping optional and array layers: `Message`, `AlbumMedia[]`. */
export function namedTypeOf(schema: z.ZodType): string | undefined {
  const def = schema._zod.def as any;
  if (['optional', 'nullable', 'default', 'prefault', 'readonly'].includes(def.type)) return namedTypeOf(def.innerType);
  if (def.type === 'array') {
    const item = namedTypeOf(def.element);
    return item ? `${item}[]` : undefined;
  }
  return schemaName(schema);
}

// Walk the Zod contract before JSON Schema erases brands, undefined and names.
export function describeType(schema: z.ZodType, inline = false): string {
  const name = schemaName(schema);
  if (!inline && name && schema._zod.def.type !== 'unknown') return name;
  if (schema === interactive.BookingTimestampRegistrySchema) return "import('@open-wa/schema/interactive').BookingTimestamp";
  const def = schema._zod.def as any;
  switch (def.type) {
    case 'any': case 'unknown': return 'unknown';
    case 'template_literal': return '`data:${string};base64,${string}`';
    case 'string': case 'number': case 'boolean': case 'null': case 'undefined': case 'void': case 'never': return def.type;
    case 'literal': return [...def.values].map((v) => JSON.stringify(v) ?? 'undefined').join(' | ');
    case 'enum': return [...new Set(Object.values(def.entries))].map((v) => JSON.stringify(v)).join(' | ');
    case 'array': {
      const item = describeType(def.element);
      return `${item.includes(' | ') ? `(${item})` : item}[]`;
    }
    case 'union': return [...new Set(def.options.flatMap((s: z.ZodType) => describeType(s).split(' | ')))].join(' | ');
    case 'intersection': return `${describeType(def.left)} & ${describeType(def.right)}`;
    case 'optional': return `${describeType(def.innerType)} | undefined`;
    case 'nullable': return `${describeType(def.innerType)} | null`;
    case 'default': case 'prefault': case 'readonly': return describeType(def.innerType);
    case 'lazy': return describeType(def.getter());
    case 'pipe': return describeType(def.out);
    case 'record': return `Record<${describeType(def.keyType)}, ${describeType(def.valueType)}>`;
    case 'object': return `{ ${Object.entries(def.shape).map(([key, value]) => {
      const field = value as z.ZodType;
      return `${key}${field.isOptional() ? '?' : ''}: ${describeType(field).replace(/ \| undefined$/, '')}`;
    }).join('; ')} }`;
    case 'tuple': return `[${def.items.map((item: z.ZodType) => describeType(item)).join(', ')}]`;
    default: throw new Error(`Undocumented Zod output kind: ${def.type}`);
  }
}

export function typeLinks(type: string): Record<string, string> {
  return Object.fromEntries(Object.keys(namedSchemas)
    .filter((name) => new RegExp(`\\b${name}\\b`).test(type))
    .map((name) => [name, `/docs/reference/client/return-types#${name.toLowerCase()}`]));
}
