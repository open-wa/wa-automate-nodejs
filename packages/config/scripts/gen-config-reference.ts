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

type ZodDef = {
  type?: string;
  innerType?: z.ZodTypeAny;
  element?: z.ZodTypeAny;
  defaultValue?: unknown;
  entries?: Record<string, unknown>;
  values?: unknown[];
  shape?: Record<string, z.ZodTypeAny>;
};

function getDef(schema: z.ZodTypeAny): ZodDef | undefined {
  return ((schema as { def?: unknown; _def?: unknown }).def ??
    (schema as { _def?: unknown })._def) as ZodDef | undefined;
}

type FieldInfo = { type: string; default: string | null; description: string | null };

function describeField(schema: z.ZodTypeAny): FieldInfo {
  let current: z.ZodTypeAny | undefined = schema;
  let description: string | null = (schema as { description?: string }).description ?? null;
  let defaultValue: string | null = null;

  // Unwrap optional/nullable/default, capturing the default and any description.
  for (let i = 0; i < 8 && current; i++) {
    const def = getDef(current);
    if (!def) break;
    const desc = (current as { description?: string }).description;
    if (desc && !description) description = desc;
    if (def.type === 'default') {
      const dv = typeof def.defaultValue === 'function' ? (def.defaultValue as () => unknown)() : def.defaultValue;
      defaultValue = JSON.stringify(dv);
      current = def.innerType;
      continue;
    }
    if (def.type === 'optional' || def.type === 'nullable' || def.type === 'readonly') {
      current = def.innerType;
      continue;
    }
    break;
  }

  const def = current ? getDef(current) : undefined;
  let type = 'unknown';
  switch (def?.type) {
    case 'string':
    case 'number':
    case 'boolean':
      type = def.type;
      break;
    case 'enum': {
      const values = def.entries ? Object.values(def.entries) : (def.values ?? []);
      type = values.map((v) => JSON.stringify(v)).join(' | ') || 'enum';
      break;
    }
    case 'array':
      type = `${def.element ? (getDef(def.element)?.type ?? 'any') : 'any'}[]`;
      break;
    case 'object':
      type = 'object';
      break;
    default:
      type = def?.type ?? 'unknown';
  }

  return { type, default: defaultValue, description };
}

function resolveFieldSchema(configKey: string): z.ZodTypeAny | undefined {
  const parts = configKey.split('.');
  let shape: Record<string, z.ZodTypeAny> | undefined = ConfigSchema.shape as Record<string, z.ZodTypeAny>;
  let field: z.ZodTypeAny | undefined;
  for (const part of parts) {
    if (!shape) return undefined;
    field = shape[part];
    if (!field) return undefined;
    // Unwrap to an object shape for the next segment.
    let inner: z.ZodTypeAny | undefined = field;
    for (let i = 0; i < 6 && inner; i++) {
      const def = getDef(inner);
      if (def?.type === 'object') {
        shape = def.shape;
        break;
      }
      inner = def?.innerType;
      if (!inner) {
        shape = undefined;
        break;
      }
    }
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
  const src = fs.readFileSync(path.resolve(__dirname, '../src/schema/config.ts'), 'utf8');
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
      if (/^[A-Za-z0-9][A-Za-z0-9 &/-]+$/.test(label) && label.length <= 40 && !label.endsWith('.')) {
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
    const info = schema ? describeField(schema) : { type: 'unknown', default: null, description: null };
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

const banner = '// AUTO-GENERATED by packages/config/scripts/gen-config-reference.ts. Do not edit.\n';
// Group order follows schema declaration order (Map preserves insertion order),
// with any fallback groups appended.
const groupOrder = Array.from(new Set(GROUP_BY_KEY.values()));
for (const e of entries) if (!groupOrder.includes(e.group)) groupOrder.push(e.group);

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
console.log(`Generated config manifest with ${entries.length} keys at ${path.relative(process.cwd(), outPath)}`);
