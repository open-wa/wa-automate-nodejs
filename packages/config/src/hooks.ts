import { z } from 'zod';

export interface EventHookContext {
  readonly sessionId: string;
  readonly plugin: string;
  readonly event: string;
  readonly payload: unknown;
}

export interface ActionHookContext {
  readonly sessionId: string;
  readonly plugin: string;
  readonly method: string;
  readonly args: unknown[] | Record<string, unknown>;
}

export type EventHook = (context: EventHookContext) => boolean | void | Promise<boolean | void>;
export type ActionHook = (context: ActionHookContext) => boolean | void | Promise<boolean | void>;

/** Operator-owned hooks run before plugins receive events or invoke actions. */
export const HooksConfigSchema = z.object({
  chatFilter: z.object({
    allow: z.array(z.string().regex(/^[0-9]+(?:-[0-9]+)?@(?:c\.us|lid|g\.us)$/))
      .describe('Exact chat IDs plugins may operate in. Include the known phone-number and LID IDs explicitly. An empty array blocks every chat.'),
  }).strict().optional(),
  beforeEvent: z.custom<EventHook>(value => typeof value === 'function', 'Expected an event hook function.').optional(),
  beforeAction: z.custom<ActionHook>(value => typeof value === 'function', 'Expected an action hook function.').optional(),
}).strict();

export type HostHooks = z.output<typeof HooksConfigSchema>;
