import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '../Client';
import { SendTextError } from '../SendTextError';
import type { OpenWAClient, OpenWAEventMap, STATE, Transport } from '@open-wa/core';
import { HyperEmitter } from '@open-wa/hyperemitter';

const SENT_ID = 'true_126658937942107@lid_3EB09833D447E37A1595B5';
const QUOTED_ID = 'false_126658937942107@lid_ACFFBBABB0397452EB3044DB86881362';

/** A client whose page calls run in this process, against whatever `WAPI` global the test installs. */
function createTestClient() {
  const events = new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true });
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const openwaClient: OpenWAClient = {
    sessionId: 'test-session',
    events,
    logger: logger as any,
    session: {} as any,
    plugins: { bindRuntime: vi.fn() } as any,
    config: {},
    registerFinalizationHook: vi.fn(() => () => undefined),
    start: vi.fn(),
    stop: vi.fn(),
    getState: vi.fn(() => 'READY' as STATE),
    getReadiness: vi.fn(),
    getTransport: vi.fn(),
    screenshot: vi.fn(),
    evaluateScript: vi.fn(),
  };
  const transport = {
    setPortableMessageHandler: vi.fn(() => () => undefined),
    evaluate: vi.fn(async (fn: (arg: unknown) => unknown, arg: unknown) => fn(arg)),
  } as unknown as Transport;
  return { client: new Client({ client: openwaClient, transport }), transport, logger };
}

async function failure(send: Promise<unknown>): Promise<SendTextError> {
  const error = await send.then(() => undefined, (thrown: unknown) => thrown);
  expect(error).toBeInstanceOf(SendTextError);
  return error as SendTextError;
}

describe('Client mention methods', () => {
  let client: Client;
  let transport: Transport;
  let logger: { error: ReturnType<typeof vi.fn> };
  let sendMentions: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ client, transport, logger } = createTestClient());
    sendMentions = vi.fn(async () => ({ ok: true, id: SENT_ID }));
    vi.stubGlobal('WAPI', { sendMentions });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sendTextWithMentions sends the text, the hideTags flag and the listed contacts, and returns the sent ID', async () => {
    const id = await client.sendTextWithMentions('120363000000000000@g.us' as any, 'Hello @447700000000', true, ['447700000001@c.us'] as any);

    expect(id).toBe(SENT_ID);
    expect(sendMentions).toHaveBeenCalledTimes(1);
    expect(sendMentions).toHaveBeenCalledWith('120363000000000000@g.us', 'Hello @447700000000', {
      hideTags: true,
      mentions: ['447700000001@c.us'],
    });
  });

  it('sendTextWithMentions needs only a chat and a text', async () => {
    await client.sendTextWithMentions('447700000000@c.us' as any, 'Hello @447700000000');

    expect(sendMentions).toHaveBeenCalledWith('447700000000@c.us', 'Hello @447700000000', { hideTags: undefined, mentions: undefined });
  });

  it('sendReplyWithMentions quotes the message it replies to', async () => {
    const id = await client.sendReplyWithMentions('447700000000@c.us' as any, 'On it @447700000000', QUOTED_ID as any, false, ['447700000000@c.us'] as any);

    expect(id).toBe(SENT_ID);
    expect(sendMentions).toHaveBeenCalledWith('447700000000@c.us', 'On it @447700000000', {
      quotedMsgId: QUOTED_ID,
      hideTags: false,
      mentions: ['447700000000@c.us'],
    });
  });

  it('rejects invalid arguments before anything reaches the page', async () => {
    const error = await failure(client.sendTextWithMentions('447700000000@c.us' as any, ''));

    expect(error.code).toBe('INVALID_ARGUMENT');
    expect(error.outcome).toBe('not_sent');
    expect(error.message).toContain('sendTextWithMentions');
    expect(transport.evaluate).not.toHaveBeenCalled();

    const reply = await failure(client.sendReplyWithMentions('447700000000@c.us' as any, 'Hello', undefined as any));
    expect(reply.code).toBe('INVALID_ARGUMENT');
    expect(reply.message).toContain('replyMessageId');
    expect(transport.evaluate).not.toHaveBeenCalled();
  });

  it('explains that the session has not loaded the mentions patch, instead of failing on a missing function', async () => {
    vi.stubGlobal('WAPI', {});

    const error = await failure(client.sendTextWithMentions('447700000000@c.us' as any, 'Hello @447700000000'));

    expect(error.code).toBe('SEND_REJECTED');
    expect(error.outcome).toBe('not_sent');
    expect(error.message).toBe('sendTextWithMentions is not part of the runtime patches this session loaded. Restart the session to load the current patches.');
  });

  it('reports a refusal from the page as not sent, with the page\'s reason', async () => {
    sendMentions.mockResolvedValue({ ok: false, code: 'QUOTED_MESSAGE_NOT_FOUND', outcome: 'not_sent', message: `Message ${QUOTED_ID} was not found, so it cannot be replied to.` });

    const error = await failure(client.sendReplyWithMentions('447700000000@c.us' as any, 'Hello', QUOTED_ID as any));

    expect(error.code).toBe('SEND_REJECTED');
    expect(error.outcome).toBe('not_sent');
    expect(error.message).toBe(`sendReplyWithMentions: Message ${QUOTED_ID} was not found, so it cannot be replied to.`);
  });

  it('keeps the ID of a message whose result could not be confirmed', async () => {
    sendMentions.mockResolvedValue({ ok: false, code: 'SEND_FAILED', outcome: 'unknown', message: 'The result of the send could not be confirmed in time. Check the chat before retrying.', id: SENT_ID });

    const error = await failure(client.sendTextWithMentions('120363000000000000@g.us' as any, 'Hello @447700000000'));

    expect(error.code).toBe('SEND_FAILED');
    expect(error.outcome).toBe('unknown');
    expect(error.message).toContain(`Message ID: ${SENT_ID}.`);
  });

  it('maps a chat that needs a license to LICENSE_REQUIRED', async () => {
    sendMentions.mockResolvedValue({ ok: false, code: 'LICENSE_REQUIRED', outcome: 'not_sent', message: 'Not a contact' });

    const error = await failure(client.sendTextWithMentions('447700000000@c.us' as any, 'Hello @447700000000'));

    expect(error.code).toBe('LICENSE_REQUIRED');
    expect(error.outcome).toBe('not_sent');
    expect(logger.error).toHaveBeenCalledWith('send_mentions_unknown_number_requires_license', expect.objectContaining({ sessionId: 'test-session' }));
  });

  it('never reports success without a valid message ID', async () => {
    for (const result of [true, 'OK', { ok: true }, { ok: true, id: 'not-an-id' }, undefined]) {
      sendMentions.mockResolvedValue(result);
      const error = await failure(client.sendTextWithMentions('447700000000@c.us' as any, 'Hello @447700000000'));
      expect(error.code).toBe('INVALID_SEND_RESULT');
      expect(error.outcome).toBe('unknown');
    }
  });

  it('treats a page call that throws as an unknown outcome and does not retry', async () => {
    sendMentions.mockRejectedValue(new Error('Execution context was destroyed'));

    const error = await failure(client.sendTextWithMentions('447700000000@c.us' as any, 'Hello @447700000000'));

    expect(error.code).toBe('SEND_FAILED');
    expect(error.outcome).toBe('unknown');
    expect(sendMentions).toHaveBeenCalledTimes(1);
  });
});
