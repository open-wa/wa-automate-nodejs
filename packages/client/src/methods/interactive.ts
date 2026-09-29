import type { Client } from '../Client';
import {
  SendInteractiveInputSchema, SendRawMessageInputSchema, fileToDataUrlCodec,
  type InteractiveContent, type InteractiveHeader, type JsonValue, type MessageId,
} from '@open-wa/schema';

declare const WAPI: {
  sendInteractive?: (to: string, content: InteractiveContent) => Promise<string>;
  sendRawMessage?: (to: string, payload: Record<string, JsonValue>) => Promise<string>;
};

export interface InteractiveMethods {
  sendInteractive(to: string, content: InteractiveContent): Promise<MessageId>;
  sendRawMessage(to: string, payload: Record<string, JsonValue>): Promise<MessageId>;
}

async function invokeSender(client: Client, request:
  | { method: 'sendInteractive'; to: string; content: InteractiveContent }
  | { method: 'sendRawMessage'; to: string; payload: Record<string, JsonValue> }
): Promise<MessageId> {
  const result = await client.evaluate(async input => {
    try {
      if (typeof WAPI[input.method] !== 'function') {
        throw new Error(`${input.method} is unavailable in this session. Start the client with an Insiders-or-higher license and an up-to-date license payload.`);
      }
      const id = input.method === 'sendInteractive'
        ? await WAPI.sendInteractive!(input.to, input.content)
        : await WAPI.sendRawMessage!(input.to, input.payload);
      return { ok: true as const, id };
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }
  }, request);
  if (!result.ok) throw new Error(result.message, { cause: { stack: result.stack } });
  if (typeof result.id !== 'string' || !result.id) throw new Error(`${request.method} did not return a message ID; delivery could not be confirmed.`);
  return result.id as MessageId;
}

async function resolveHeader<T extends InteractiveHeader>(header: T, path: string): Promise<T> {
  if (header.type === 'text') return header;
  try {
    const source = await fileToDataUrlCodec.decode(header.source);
    if (typeof source !== 'string' || !source.startsWith('data:')) throw new Error('Media did not resolve to a data URL');
    return { ...header, source };
  } catch (cause) {
    throw new Error(`${path}.source: could not load the media. Use a reachable HTTP(S) URL, a readable file on the API host, or a base64 data URL.`, { cause });
  }
}

export function interactiveMethods(client: Client): InteractiveMethods {
  return {
    async sendInteractive(to, content) {
      const input = SendInteractiveInputSchema.parse({ to, content });
      // Work on parsed copies so callers can reuse their builder documents.
      if ('header' in input.content && input.content.header) {
        input.content.header = await resolveHeader(input.content.header, 'content.header');
      }
      if (input.content.type === 'carousel') {
        for (const [index, card] of input.content.cards.entries()) {
          card.header = await resolveHeader(card.header, `content.cards[${index}].header`);
        }
      }
      return invokeSender(client, { method: 'sendInteractive', ...input });
    },
    async sendRawMessage(to, payload) {
      const input = SendRawMessageInputSchema.parse({ to, payload });
      return invokeSender(client, { method: 'sendRawMessage', ...input });
    },
  };
}
