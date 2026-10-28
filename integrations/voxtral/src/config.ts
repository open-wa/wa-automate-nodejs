import { z } from '@open-wa/plugin-sdk';
import { agentSettingsSchema } from '@open-wa/integration-jev/agent';

export const defaultInstructions = 'You are a helpful voice assistant. Reply in the language the person uses. Keep answers brief and easy to follow when spoken. Ask when you need more information.';
const instructions = z.union([z.string(), z.array(z.string())]);
export const settingsSchema = z.object({
  mode: z.enum(['voice-notes', 'calls', 'both']).default('voice-notes'),
  agent: z.object({ instructions: instructions.default(defaultInstructions), model: z.string().trim().min(1).default('mistral-small-latest') }).prefault({}),
  voice: z.object({ id: z.string().trim().min(1).default('voice_478') }).prefault({}),
  language: z.string().trim().min(2).default('auto'),
  voiceNotes: z.object({ includeText: z.boolean().default(false), acceptText: z.boolean().default(false) }).prefault({}),
  calls: z.object({ answer: z.enum(['auto', 'manual']).default('auto'), greeting: z.string().trim().default('Hello, you are speaking with our AI assistant. How can I help?') }).prefault({}),
  actions: agentSettingsSchema.shape.actions,
  conversation: agentSettingsSchema.shape.conversation,
  models: z.object({
    transcription: z.string().trim().min(1).default('voxtral-mini-transcribe-3-0'),
    realtimeTranscription: z.string().trim().min(1).default('voxtral-mini-transcribe-realtime-3-0'),
    speech: z.string().trim().min(1).default('voxtral-mini-tts-3-0'),
  }).prefault({}),
  contextBias: z.array(z.string()).default([]),
}).strict();
export const configSchema = settingsSchema.extend({ apiKey: z.string().optional(), jevApiKey: z.string().optional() });
export type Settings = z.output<typeof settingsSchema>;
export type VoxtralConfig = z.output<typeof configSchema>;
export type SettingsPatch = Record<string, unknown>;

export function mergeSettings(base: unknown, patch: SettingsPatch): Settings {
  const merged = { ...base as Record<string, unknown> };
  for (const [key, value] of Object.entries(patch)) {
    if (!Object.hasOwn(settingsSchema.shape, key)) throw new Error(`Unknown setting: ${key}`);
    merged[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? { ...merged[key] as object, ...value as object } : value;
  }
  return settingsSchema.parse(merged);
}

export function normalizeSettings(settings: Settings): Settings & { agent: { instructions: string; model: string } } {
  const lines = typeof settings.agent.instructions === 'string' ? [settings.agent.instructions] : settings.agent.instructions;
  return {
    ...settings,
    agent: { ...settings.agent, instructions: lines.map(line => line.trim()).filter(Boolean).join('\n') || defaultInstructions },
    contextBias: [...new Set(settings.contextBias.map(term => term.trim()).filter(Boolean))],
  };
}
