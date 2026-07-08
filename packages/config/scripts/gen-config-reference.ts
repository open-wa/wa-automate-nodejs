/**
 * Generate a config manifest for the docs Config Explorer: every config key in
 * its three forms (config file key, CLI flag, WA_ env var) plus type, default,
 * and description. Emitted as a typed TS module the docs import directly.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { ConfigSchema } from '../src/schema/config.ts';
import { getConfigEnvVars } from '../src/env.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type JsonSchema = {
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  items?: JsonSchema;
};

type PublicZodSchema = z.ZodTypeAny & {
  type?: string;
  shape?: Record<string, z.ZodTypeAny>;
  element?: z.ZodTypeAny;
  options?: z.ZodTypeAny[];
  enum?: Record<string, unknown>;
  unwrap?: () => z.ZodTypeAny;
  removeDefault?: () => z.ZodTypeAny;
  meta?: () => { description?: string };
  toJSONSchema?: () => JsonSchema;
};

function asPublicSchema(schema: z.ZodTypeAny): PublicZodSchema {
  return schema as PublicZodSchema;
}

type FieldInfo = {
  type: string;
  default: string | null;
  description: string | null;
};

function getDescription(schema: z.ZodTypeAny): string | null {
  const publicSchema = asPublicSchema(schema);
  return publicSchema.description ?? publicSchema.meta?.()?.description ?? null;
}

function getDefault(schema: z.ZodTypeAny): string | null {
  const parsed = schema.safeParse(undefined);
  if (!parsed.success || parsed.data === undefined) return null;
  return JSON.stringify(parsed.data) ?? null;
}

function unwrapSchema(schema: z.ZodTypeAny): PublicZodSchema {
  let current = asPublicSchema(schema);
  for (let i = 0; i < 8; i++) {
    const next =
      current.type === 'default'
        ? current.removeDefault?.()
        : current.type === 'optional' ||
            current.type === 'nullable' ||
            current.type === 'readonly'
          ? current.unwrap?.()
          : undefined;
    if (!next || next === current) break;
    current = asPublicSchema(next);
  }
  return current;
}

function tryJsonSchema(schema: z.ZodTypeAny): JsonSchema | undefined {
  try {
    return asPublicSchema(schema).toJSONSchema?.();
  } catch {
    return undefined;
  }
}

function typeFromJsonSchema(schema: JsonSchema | undefined): string | null {
  if (!schema) return null;
  if (schema.const !== undefined) return JSON.stringify(schema.const);
  if (schema.enum?.length)
    return schema.enum.map((v) => JSON.stringify(v)).join(' | ');

  const variants = schema.anyOf ?? schema.oneOf;
  if (variants?.length) {
    const types = Array.from(
      new Set(variants.map(typeFromJsonSchema).filter(Boolean)),
    );
    return types.length > 0 ? types.join(' | ') : 'union';
  }

  const type = Array.isArray(schema.type)
    ? schema.type.filter((t) => t !== 'null')
    : schema.type;
  if (Array.isArray(type))
    return type.map((t) => (t === 'integer' ? 'number' : t)).join(' | ');
  if (type === 'integer') return 'number';
  if (type === 'array') return `${typeFromJsonSchema(schema.items) ?? 'any'}[]`;
  if (
    type === 'object' ||
    type === 'string' ||
    type === 'number' ||
    type === 'boolean'
  )
    return type;
  return null;
}

function fallbackType(schema: z.ZodTypeAny): string {
  const publicSchema = asPublicSchema(schema);
  switch (publicSchema.type) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'object':
      return publicSchema.type;
    case 'array':
      return `${publicSchema.element ? describeType(publicSchema.element) : 'any'}[]`;
    case 'enum': {
      const values = publicSchema.enum ? Object.values(publicSchema.enum) : [];
      return values.map((v) => JSON.stringify(v)).join(' | ') || 'enum';
    }
    case 'union': {
      const types = Array.from(
        new Set(
          (publicSchema.options ?? [])
            .map(describeType)
            .filter((t) => t !== 'unknown'),
        ),
      );
      return types.length > 0 ? types.join(' | ') : 'union';
    }
    default:
      return publicSchema.type ?? 'unknown';
  }
}

function describeType(schema: z.ZodTypeAny): string {
  const current = unwrapSchema(schema);
  return typeFromJsonSchema(tryJsonSchema(current)) ?? fallbackType(current);
}

function describeField(schema: z.ZodTypeAny): FieldInfo {
  const current = unwrapSchema(schema);
  const description = getDescription(schema) ?? getDescription(current);

  return {
    type: describeType(schema),
    default: getDefault(schema),
    description,
  };
}

function resolveFieldSchema(configKey: string): z.ZodTypeAny | undefined {
  const parts = configKey.split('.');
  let shape: Record<string, z.ZodTypeAny> | undefined =
    asPublicSchema(ConfigSchema).shape;
  let field: z.ZodTypeAny | undefined;
  for (const part of parts) {
    if (!shape) return undefined;
    field = shape[part];
    if (!field) return undefined;
    // Unwrap to an object shape for the next segment.
    const inner = unwrapSchema(field);
    shape = inner.type === 'object' ? inner.shape : undefined;
  }
  return field;
}

function toCliFlag(configKey: string): string | null {
  // Nested config (e.g. mcp.enabled) has no dedicated CLI flag.
  if (configKey.includes('.')) return null;
  const kebab = configKey.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return `--${kebab}`;
}

/**
 * Infer a group for each config key from the `// Section` comments already
 * present in the schema source — the schema stays the single source of truth.
 */
function inferGroups(): Map<string, string> {
  const src = fs.readFileSync(
    path.resolve(__dirname, '../src/schema/config.ts'),
    'utf8',
  );
  const marker = 'export const ConfigSchema = z.object({';
  const start = src.indexOf(marker);
  const map = new Map<string, string>();
  if (start < 0) return map;

  let currentGroup = 'General';
  let depth = 0; // brace depth relative to the object body
  const lines = src.slice(start + marker.length - 1).split('\n'); // start at the '{'

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Track brace depth so we only read top-level fields of ConfigSchema and
    // stop when the object closes.
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    const depthBefore = depth;
    depth += opens - closes;
    if (depthBefore >= 1 && depth <= 0) break; // object closed

    const comment = line.match(/^\/\/\s*(.+)$/);
    if (comment) {
      const label = comment[1].trim();
      // A section header looks like a short label, not a sentence.
      if (
        /^[A-Za-z0-9][A-Za-z0-9 &/-]+$/.test(label) &&
        label.length <= 40 &&
        !label.endsWith('.')
      ) {
        currentGroup = label;
      }
      continue;
    }

    // Only capture top-level fields (depth 1 before this line's braces).
    if (depthBefore === 1) {
      const field = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):/);
      if (field && !map.has(field[1])) {
        map.set(field[1], currentGroup);
      }
    }
  }

  return map;
}

const GROUP_BY_KEY = inferGroups();

function groupForKey(configKey: string): string {
  const top = configKey.split('.')[0];
  return GROUP_BY_KEY.get(top) ?? 'Other';
}

const entries = getConfigEnvVars('WA_')
  .map(({ configKey, envVar }) => {
    const schema = resolveFieldSchema(configKey);
    const info = schema
      ? describeField(schema)
      : { type: 'unknown', default: null, description: null };
    return {
      key: configKey,
      group: groupForKey(configKey),
      type: info.type,
      default: info.default,
      description: info.description,
      cliFlag: toCliFlag(configKey),
      envVar,
    };
  })
  .sort((a, b) => a.key.localeCompare(b.key));

const banner =
  '// AUTO-GENERATED by packages/config/scripts/gen-config-reference.ts. Do not edit.\n';
// Group order follows schema declaration order (Map preserves insertion order),
// with any fallback groups appended.
const groupOrder = Array.from(new Set(GROUP_BY_KEY.values()));
for (const e of entries)
  if (!groupOrder.includes(e.group)) groupOrder.push(e.group);

const body = `export type ConfigManifestEntry = {
  key: string;
  group: string;
  type: string;
  default: string | null;
  description: string | null;
  cliFlag: string | null;
  envVar: string;
};

/** Group labels in schema-declaration order. */
export const configGroups: string[] = ${JSON.stringify(groupOrder, null, 2)};

export const configManifest: ConfigManifestEntry[] = ${JSON.stringify(entries, null, 2)};
`;

const outDir = path.resolve(__dirname, '../../../apps/docs/src/generated');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'config-manifest.ts');
fs.writeFileSync(outPath, banner + body);
console.log(
  `Generated config manifest with ${entries.length} keys at ${path.relative(process.cwd(), outPath)}`,
);
