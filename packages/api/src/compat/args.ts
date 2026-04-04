import { z, type HttpMethodDefinition } from '@open-wa/schema';

function mapArrayArgs(def: HttpMethodDefinition, args: unknown[]): Record<string, unknown> {
  return def.parameterOrder.reduce<Record<string, unknown>>((acc, key, index) => {
    if (index < args.length) {
      acc[key] = args[index];
    }

    return acc;
  }, {});
}

export function normalizeMethodPayload(def: HttpMethodDefinition, payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return mapArrayArgs(def, payload);
  }

  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const record = payload as Record<string, unknown>;

  if ('args' in record) {
    const args = record.args;

    if (Array.isArray(args)) {
      return mapArrayArgs(def, args);
    }

    if (args && typeof args === 'object') {
      return args;
    }
  }

  if (record.input && typeof record.input === 'object' && !Array.isArray(record.input)) {
    return record.input;
  }

  if (def.inputSchema instanceof z.ZodObject) {
    const knownKeys = new Set(Object.keys(def.inputSchema.shape));
    const filtered = Object.fromEntries(
      Object.entries(record).filter(([key]) => knownKeys.has(key))
    );

    if (Object.keys(filtered).length > 0) {
      return filtered;
    }
  }

  return record;
}
