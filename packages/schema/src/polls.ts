import { z } from 'zod';
import { ChatIdSchema, ContactIdSchema, MessageIdSchema } from './common-types';

export const PollSendOptionsSchema = z.strictObject({
  selectableCount: z.number().int().min(0).optional().describe('Selection limit; default 1, zero allows all options'),
  quotedMsgId: MessageIdSchema.optional(),
  endTime: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional().describe('Closing time as Unix milliseconds; must be in the future'),
  hideVoterNames: z.boolean().optional().describe('Hide voter names in WhatsApp; not a cryptographic anonymity guarantee'),
});
export type PollSendOptions = z.infer<typeof PollSendOptionsSchema>;
export const PollVoteSchema = z.strictObject({
  pollId: MessageIdSchema,
  chatId: ChatIdSchema,
  id: MessageIdSchema.optional().describe('Omitted when the poll hides voter names'),
  senderId: ContactIdSchema.optional().describe('Omitted when the poll hides voter names'),
  selectedOptionIds: z.array(z.number().int().nonnegative()),
  timestamp: z.number().int().nonnegative().describe('Native vote timestamp in Unix milliseconds'),
  fromMe: z.boolean(),
  hideVoterNames: z.boolean(),
});
export type PollVote = z.infer<typeof PollVoteSchema>;
export const PollResultsSchema = z.strictObject({
  pollId: MessageIdSchema,
  chatId: ChatIdSchema,
  name: z.string(),
  selectableCount: z.number().int().nonnegative(),
  endTime: z.number().int().nonnegative().optional(),
  isClosed: z.boolean(),
  hideVoterNames: z.boolean(),
  options: z.array(z.strictObject({ id: z.number().int().nonnegative(), name: z.string(), count: z.number().int().nonnegative() })),
  voterCount: z.number().int().nonnegative(),
  votes: z.array(PollVoteSchema).optional().describe('Omitted for hidden-voter polls'),
  scope: z.literal('synced').describe('Hydrated local WhatsApp data, which may not include unsynced votes'),
});
export type PollResults = z.infer<typeof PollResultsSchema>;
export const PinDurationSchema = z.enum(['OneDay', 'SevenDays', 'ThirtyDays']);
export type PinDuration = z.infer<typeof PinDurationSchema>;
