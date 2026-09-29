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

/**
 * These are the flags parsed by packages/wa-automate/src/cli-runtime.ts.
 * ConfigSchema is broader than the v5 CLI adapter, so deriving a flag by
 * kebab-casing every schema key creates commands the runtime ignores.
 */
const CLI_FLAGS: Record<string, string> = {
  sessionId: '--session-id',
  port: '--port',
  host: '--host',
  apiKey: '--api-key',
  logLevel: '--log-level',
  ezqr: '--no-ezqr',
  headless: '--headless',
  useChrome: '--use-chrome',
  useLightpanda: '--use-lightpanda',
  logConsole: '--log-console',
  aggressiveGarbageCollection: '--aggressive-garbage-collection',
  dashboard: '--no-dashboard',
  ephemeral: '--ephemeral',
  sandboxChats: '--sandbox-chats',
  'sandboxChats.isolation': '--sandbox-isolation',
  qrTimeout: '--qr-timeout',
  dashboardPort: '--dashboard-port',
  licenseKey: '--license-key',
  webhook: '--webhook',
  proxyHost: '--proxy-host',
  proxyToken: '--proxy-token',
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
  let field: z.ZodTypeAny | undefined;
  for (const part of parts) {
    field = field ? childSchema(field, part) : asPublicSchema(ConfigSchema).shape?.[part];
    if (!field) return undefined;
  }
  return field;
}

function childSchema(schema: z.ZodTypeAny, key: string): z.ZodTypeAny | undefined {
  const current = unwrapSchema(schema);
  if (current.type === 'object') return current.shape?.[key];
  if (current.type === 'union') {
    return current.options?.map((option) => childSchema(option, key)).find(Boolean);
  }
  return undefined;
}

function toCliFlag(configKey: string): string | null {
  return CLI_FLAGS[configKey] ?? null;
}

function nestedConfigKeys(schema: z.ZodTypeAny, prefix: string): string[] {
  const current = unwrapSchema(schema);
  if (current.type === 'union') {
    return Array.from(
      new Set(
        (current.options ?? []).flatMap((option) =>
          nestedConfigKeys(option, prefix),
        ),
      ),
    );
  }
  if (current.type !== 'object' || !current.shape) return [];

  return Object.entries(current.shape).flatMap(([key, child]) => {
    const path = `${prefix}.${key}`;
    return [path, ...nestedConfigKeys(child, path)];
  });
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

const GROUP_OVERRIDES: Record<string, string> = {
  mcp: 'MCP',
  plugins: 'Plugin System',
  pluginConfig: 'Plugin System',
  s3Sync: 'Session Sync',
};

function groupForKey(configKey: string): string {
  const top = configKey.split('.')[0];
  return GROUP_OVERRIDES[top] ?? GROUP_BY_KEY.get(top) ?? 'Other';
}

const envVars = new Map(
  getConfigEnvVars('WA_').map(({ configKey, envVar }) => [configKey, envVar]),
);
const topLevelKeys = Object.keys(asPublicSchema(ConfigSchema).shape ?? {});
const configKeys = topLevelKeys.flatMap((key) => {
  const schema = resolveFieldSchema(key);
  return [key, ...(schema ? nestedConfigKeys(schema, key) : [])];
});

function envVarForKey(configKey: string): string | null {
  const direct = envVars.get(configKey);
  if (direct) return direct;

  const topLevelKey = configKey.split('.')[0];
  const topLevelSchema = resolveFieldSchema(topLevelKey);
  // The environment adapter parses JSON for object fields, so nested values
  // can travel through their parent's WA_* variable even without flat aliases.
  return topLevelSchema && describeType(topLevelSchema) === 'object'
    ? envVars.get(topLevelKey) ?? null
    : null;
}

const entries = configKeys
  .map((configKey) => {
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
      // A null value means this adapter does not accept the nested key. The
      // config-file representation remains available for every schema field.
      envVar: envVarForKey(configKey),
    };
  })
  .filter((entry, index, all) => all.findIndex((candidate) => candidate.key === entry.key) === index)
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
  envVar: string | null;
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
