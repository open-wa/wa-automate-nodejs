import { z } from '@open-wa/plugin-sdk';

export const agentSettingsSchema = z.object({
  agent: z.object({ instructions: z.union([z.string(), z.array(z.string())]).default('You are a helpful WhatsApp assistant. Reply briefly in the language the person uses.'), model: z.string().trim().min(1).default('mistral-small-latest') }).prefault({}),
  actions: z.object({ sendMessage: z.boolean().default(true), classifierModel: z.string().trim().min(1).default('jev-latest') }).prefault({}),
  conversation: z.object({ idleTimeoutSeconds: z.number().int().min(60).max(86400).default(1800), timeZone: z.preprocess(value => value === '' ? undefined : value, z.string().trim().refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }, 'Use an IANA timezone.').optional()) }).prefault({}),
});
export const settingsSchema = agentSettingsSchema.strict();
export const configSchema = settingsSchema.extend({ apiKey: z.string().optional(), jevApiKey: z.string().optional() });
export type AgentSettings = z.output<typeof agentSettingsSchema>;
export type JevConfig = z.output<typeof configSchema>;
export function mergeSettings(base: AgentSettings, patch: Record<string, unknown>): AgentSettings {
  const next = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (!Object.hasOwn(settingsSchema.shape, key)) throw new Error(`Unknown setting: ${key}`);
    next[key] = value && typeof value === 'object' && !Array.isArray(value) ? { ...next[key] as object, ...value as object } : value;
  }
  return settingsSchema.parse(next);
}
