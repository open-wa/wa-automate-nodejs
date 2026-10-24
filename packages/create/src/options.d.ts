export interface SetupOptions {
  directory: string;
  mode: 'easy-api' | 'sdk';
  language: 'js' | 'ts';
  browser: 'auto' | 'system-chrome' | 'chrome' | 'chromium';
  plugins: string[];
  voxtralMode: 'voice-notes' | 'calls' | 'both';
  install: boolean;
}
export interface Choice<T extends string = string> { value: T; label: string; description: string }
export const choices: { [K in 'mode' | 'language' | 'browser' | 'voxtralMode']: Choice<SetupOptions[K]>[] };
export const pluginChoices: (Choice & { package: string; modes: string[] })[];
export const defaults: SetupOptions;
export const flags: Record<string, { key: keyof SetupOptions; description: string }>;
export function normalizeOptions(input?: Partial<SetupOptions>): SetupOptions;
export function optionErrors(options: SetupOptions): string[];
export function buildCommand(options: SetupOptions): string;
export function readBuilderSearch(search: Record<string, unknown>): SetupOptions;
