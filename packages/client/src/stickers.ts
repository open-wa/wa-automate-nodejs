import type { Client } from './Client';
import type { StickerInput, StickerJob, StickerRuntime } from '@open-wa/stickers';
import type { MessageId } from '@open-wa/schema';
import { SendTextResultSchema } from '@open-wa/schema';
import { SendStickerError } from './SendStickerError';

type StickerSendResult = { ok: true; messageId: string } | { ok: false; code: string; message: string; outcome: 'not_sent' | 'unknown' };
declare const WAPI: {
  stickerRuntimeVersion?: string;
  sendStickerJob?: (job: { to: string; bytes: number[]; author?: string; pack?: string; quotedMsgId?: string }) => Promise<StickerSendResult>;
};
const runtimes = new WeakMap<Client, Promise<StickerRuntime>>();

export async function disposeClientStickers(client: Client): Promise<void> {
  const pending = runtimes.get(client); runtimes.delete(client);
  if (pending) await (await pending).dispose();
}

export async function sendClientSticker(client: Client, to: string, input: StickerInput, job: StickerJob = {}): Promise<MessageId> {
  if (typeof to !== 'string' || !/^[^\s_]+@(?:c\.us|lid|g\.us)$/.test(to)) throw new SendStickerError('Supply a supported chat destination.', { code: 'INVALID_ARGUMENT', outcome: 'not_sent' });
  const available = await client.evaluate(() => typeof WAPI.sendStickerJob === 'function' && WAPI.stickerRuntimeVersion === '1', undefined);
  if (!available) throw new SendStickerError('The private sticker runtime patch must be applied before sending stickers.', { code: 'RUNTIME_UNAVAILABLE', outcome: 'not_sent' });
  let pending = runtimes.get(client);
  if (!pending) {
    pending = (async () => {
      const [{ createStickerRuntime }, { createBrowserBackend }] = await Promise.all([import('@open-wa/stickers'), import('@open-wa/stickers/browser')]);
      return createStickerRuntime({ browser: createBrowserBackend({ evaluate: (fn, arg) => client.evaluate(fn, arg) }) });
    })();
    runtimes.set(client, pending);
    pending.catch(() => { if (runtimes.get(client) === pending) runtimes.delete(client); });
  }
  const result = await (await pending).createSticker(input, job);
  if (job.signal?.aborted) throw new SendStickerError('Sticker sending was cancelled before submission.', { code: 'CANCELLED', outcome: 'not_sent' });
  let sent: StickerSendResult;
  try {
    sent = await client.evaluate(async request => {
      if (typeof WAPI.sendStickerJob !== 'function' || WAPI.stickerRuntimeVersion !== '1') return { ok: false as const, code: 'RUNTIME_UNAVAILABLE', message: 'The sticker runtime is unavailable.', outcome: 'not_sent' as const };
      return WAPI.sendStickerJob(request);
    }, { to, bytes: Array.from(result.bytes), author: result.author, pack: result.pack, quotedMsgId: job.quotedMsgId });
  } catch (cause) {
    throw new SendStickerError('Sticker submission has an unknown outcome; inspect the chat before retrying.', { code: 'SEND_FAILED', outcome: 'unknown', cause });
  }
  if (!sent?.ok) throw new SendStickerError(sent?.message || 'Sticker submission was not confirmed.', { code: sent?.code || 'SEND_UNCONFIRMED', outcome: sent?.outcome === 'not_sent' ? 'not_sent' : 'unknown' });
  const parsed = SendTextResultSchema.safeParse(sent.messageId);
  if (!parsed.success) throw new SendStickerError('The runtime did not return a valid sticker message ID.', { code: 'INVALID_SEND_RESULT', outcome: 'unknown' });
  return parsed.data;
}
