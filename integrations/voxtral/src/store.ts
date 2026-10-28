import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { SettingsPatch } from './config';
import { z } from '@open-wa/plugin-sdk';

const counter = z.number().finite().nonnegative();
const storedStateSchema = z.object({
  overrides: z.record(z.string(), z.unknown()), revision: counter.int(), paused: z.boolean(), pausedPeople: z.array(z.string()),
  journal: z.record(z.string(), z.enum(['processing', 'sent', 'unknown', 'failed'])),
  usage: z.object({ since: counter, audioSeconds: counter, speechCharacters: counter, inputTokens: counter, outputTokens: counter, requests: counter }),
}).strict();

export type StoredState = {
  overrides: SettingsPatch;
  revision: number;
  paused: boolean;
  pausedPeople: string[];
  journal: Record<string, 'processing' | 'sent' | 'unknown' | 'failed'>;
  usage: { since: number; audioSeconds: number; speechCharacters: number; inputTokens: number; outputTokens: number; requests: number };
};
export function emptyState(): StoredState {
  return { overrides: {}, revision: 0, paused: false, pausedPeople: [], journal: {},
    usage: { since: Date.now(), audioSeconds: 0, speechCharacters: 0, inputTokens: 0, outputTokens: 0, requests: 0 } };
}
export class VoxtralStore {
  private file: string;
  private pending: Promise<void> = Promise.resolve();
  constructor(sessionId: string) {
    const scope = createHash('sha256').update(sessionId).digest('hex').slice(0, 24);
    this.file = join(process.cwd(), '.open-wa', 'plugins', 'voxtral', scope, 'state.json');
  }
  async load(): Promise<StoredState> {
    try {
      const state = storedStateSchema.parse(JSON.parse(await readFile(this.file, 'utf8'))) as StoredState;
      state.journal = Object.fromEntries(Object.entries(state.journal).map(([id, status]) => [id, status === 'processing' ? 'unknown' : status]));
      return state;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyState();
      throw new Error('Voxtral state could not be read. Preserve state.json and correct its contents before restarting.');
    }
  }
  save(state: StoredState): Promise<void> {
    const copy = JSON.stringify({ ...state, journal: Object.fromEntries(Object.entries(state.journal).slice(-4000)) });
    this.pending = this.pending.catch(() => {}).then(async () => {
      await mkdir(join(this.file, '..'), { recursive: true, mode: 0o700 });
      const temporary = `${this.file}.tmp`;
      await writeFile(temporary, copy, { mode: 0o600 });
      await rename(temporary, this.file);
    });
    return this.pending;
  }
}
