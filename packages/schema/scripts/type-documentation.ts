import { z } from 'zod';
import * as common from '../src/common-types';
import * as returns from '../src/return-types';

export const namedSchemas = Object.fromEntries(
  [...Object.entries(common), ...Object.entries(returns)]
    .filter(([name, value]) => name.endsWith('Schema') && value instanceof z.ZodType)
    .map(([name, value]) => [name.replace(/Schema$/, ''), value as z.ZodType]),
);
const names = new Map(Object.entries(namedSchemas).map(([name, schema]) => [schema, name]));

// Walk the Zod contract before JSON Schema erases brands, undefined and names.
export function describeType(schema: z.ZodType, inline = false): string {
  const name = names.get(schema);
  if (!inline && name && schema._zod.def.type !== 'unknown') return name;
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
