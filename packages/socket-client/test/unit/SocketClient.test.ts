import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SimpleListener } from '@open-wa/wa-automate-types-only';
import { SocketClient } from '../../src/index';
import { LISTENER_SOURCES } from '../../src/listeners';
import { remoteArguments } from '../../src/remoteArguments';
import { startStubEasyApi } from './stubEasyApi';

const CHAT = '447700900123@c.us';
const ctx = { correlationId: 'c-1', ts: 1 };
const message = { id: `false_${CHAT}_ABC`, body: 'hello', from: CHAT, chatId: CHAT };

let api: Awaited<ReturnType<typeof startStubEasyApi>>;
let client: SocketClient;

beforeEach(async () => {
  api = await startStubEasyApi({ sendText: `true_${CHAT}_SENT`, sendReplyWithMentions: `true_${CHAT}_REPLY`, getAllChats: [] });
  client = await SocketClient.connect(api.url, 'stub-key');
});

afterEach(async () => {
  client.close();
  await api.close();
});

describe('direct methods', () => {
  it('are callable on the client that connect() resolves to', () => {
    // Awaiting the client used to hand back the object without its method proxy.
    expect(typeof client.sendText).toBe('function');
    expect(typeof client.sendReplyWithMentions).toBe('function');
    expect(typeof client.onMessage).toBe('function');
  });

  it('survive being awaited or returned from an async function again', async () => {
    const again = await (async () => client)();
    expect(again).toBe(client);
    expect(typeof again.sendText).toBe('function');
  });

  it('send positional arguments in order, as a v4 call does', async () => {
    await expect(client.sendText(CHAT, 'hello')).resolves.toBe(`true_${CHAT}_SENT`);
    await client.sendReplyWithMentions(CHAT, 'hello @447700900124', message.id, true, ['447700900124@c.us']);

    expect(api.calls).toEqual([
      { method: 'sendText', apiKey: 'stub-key', body: { args: [CHAT, 'hello'] } },
      { method: 'sendReplyWithMentions', apiKey: 'stub-key', body: { args: [CHAT, 'hello @447700900124', message.id, true, ['447700900124@c.us']] } },
    ]);
  });

  it('send one object as named parameters', async () => {
    await client.sendText({ to: CHAT, content: 'hello' });
    expect(api.calls[0]).toMatchObject({ method: 'sendText', body: { to: CHAT, content: 'hello' } });
  });

  it('send no arguments for a call without any', async () => {
    await expect(client.getAllChats()).resolves.toEqual([]);
    expect(api.calls[0]).toMatchObject({ method: 'getAllChats', body: { args: [] } });
  });

  it('keep an object argument positional when it is not the named parameters', async () => {
    await client.decryptMedia(message as never);
    await client.decryptMedia({ message } as never);

    expect(api.calls[0].body).toEqual({ args: [message] });
    expect(api.calls[1].body).toEqual({ message });
  });

  it('match what ask() sends for the same call', async () => {
    await client.ask('sendText', { to: CHAT, content: 'hello' });
    await client.ask('sendText', [CHAT, 'hello']);

    expect(api.calls.map((call) => call.body)).toEqual([{ to: CHAT, content: 'hello' }, { args: [CHAT, 'hello'] }]);
  });

  it('work on a client stored in a helper class', async () => {
    class Helper {
      constructor(private readonly remote: SocketClient) {}
      reply(to: string, body: string) { return this.remote.sendText(to, body); }
    }

    await expect(new Helper(client).reply(CHAT, 'hi')).resolves.toBe(`true_${CHAT}_SENT`);
  });

  it('leave non-method property reads alone', () => {
    expect((client as any).then).toBeUndefined();
    expect((client as any).toJSON).toBeUndefined();
    expect(client.flushListenersOnDisconnect).toBe(false);
    expect(() => String(client)).not.toThrow();
    expect(() => (client as any)[Symbol.toPrimitive]).not.toThrow();
  });
});

describe('listeners', () => {
  it.each([
    ['the v4 string name', 'onMessage' as const],
    ['the SimpleListener member', SimpleListener.Message],
  ])('deliver the message itself through listen() with %s', async (_label, name) => {
    const received = vi.fn();
    const id = await client.listen(name, received);
    expect(id).toEqual(expect.any(String));

    api.emit('message.received', { ctx, message });

    await vi.waitFor(() => expect(received).toHaveBeenCalledWith(message));
    expect(received).toHaveBeenCalledTimes(1);
  });

  it('deliver the same payload through the listener method', async () => {
    const received = vi.fn();
    await client.onMessage(received);
    await client.onAnyMessage(received);

    api.emit('message.received', { ctx, message });
    api.emit('message.any', { ctx, message: { ...message, id: 'other' } });

    await vi.waitFor(() => expect(received).toHaveBeenCalledTimes(2));
    expect(received).toHaveBeenNthCalledWith(1, message);
    expect(received).toHaveBeenNthCalledWith(2, { ...message, id: 'other' });
  });

  it('project the other SDK listeners from their stream events', async () => {
    const ack = vi.fn(), state = vi.fn(), logout = vi.fn(), vote = vi.fn(), form = vi.fn(), interactive = vi.fn();
    await client.listen('onAck', ack);
    await client.listen(SimpleListener.StateChanged, state);
    await client.listen('onLogout', logout);
    await client.onPollVote(vote);
    await client.onFormResponse(form);
    await client.onInteractiveResponse(interactive);

    api.emit('ack.changed', { ctx, ack: { id: message.id, ack: 3 } });
    api.emit('session.state.changed', { ...ctx, step: 'session.state.changed', details: { prev: 'STARTING', next: 'READY' } });
    api.emit('session.logout', { ...ctx, step: 'session.logout', details: { reason: 'LOGGED_OUT' } }, 1234);
    api.emit('poll.vote', { ctx, vote: { id: 'vote-1' } });
    api.emit('interactive.response', { ctx, response: { type: 'reply', id: 'r-1' } });
    api.emit('interactive.response', { ctx, response: { type: 'form', id: 'f-1' } });

    await vi.waitFor(() => expect(interactive).toHaveBeenCalledTimes(2));
    expect(ack).toHaveBeenCalledWith({ id: message.id, ack: 3 });
    expect(state).toHaveBeenCalledWith('READY');
    expect(logout).toHaveBeenCalledWith({ reason: 'LOGGED_OUT', timestamp: 1234 });
    expect(vote).toHaveBeenCalledWith({ id: 'vote-1' });
    expect(form).toHaveBeenCalledTimes(1);
    expect(form).toHaveBeenCalledWith({ type: 'form', id: 'f-1' });
  });

  it('filter participant changes to one group', async () => {
    const one = vi.fn(), all = vi.fn();
    await client.onParticipantsChanged('1@g.us', one);
    await client.onGlobalParticipantsChanged(all);

    api.emit('group.participants.changed.global', { ctx, change: { groupId: '2@g.us', action: 'add', participantIds: [CHAT] } });
    api.emit('group.participants.changed.global', { ctx, change: { groupId: '1@g.us', action: 'remove', participantIds: [CHAT] } });

    await vi.waitFor(() => expect(all).toHaveBeenCalledTimes(2));
    expect(one).toHaveBeenCalledTimes(1);
    expect(one).toHaveBeenCalledWith(expect.objectContaining({ groupId: '1@g.us', action: 'remove' }));
  });

  it('keep the payload as sent for a stream event addressed by its own name', async () => {
    const raw = vi.fn(), onSocket = vi.fn(), onEv = vi.fn();
    await client.listen('message.received', raw);
    client.socket.on('message.received', onSocket);
    client.socket.on('onMessage', onEv);

    api.emit('message.received', { ctx, message });

    await vi.waitFor(() => expect(raw).toHaveBeenCalledWith({ ctx, message }));
    expect(onSocket).toHaveBeenCalledWith({ ctx, message });
    expect(onEv).toHaveBeenCalledWith(message);
  });

  it('stop a listener by its id', async () => {
    const stopped = vi.fn(), kept = vi.fn();
    const id = await client.listen('onMessage', stopped);
    await client.listen('onMessage', kept);

    expect(client.stopListener(SimpleListener.Message, id)).toBe(true);
    expect(client.stopListener('onMessage', id)).toBe(false);
    api.emit('message.received', { ctx, message });

    await vi.waitFor(() => expect(kept).toHaveBeenCalledTimes(1));
    expect(stopped).not.toHaveBeenCalled();
  });

  it('cover every one-callback listener the SDK Client declares', () => {
    const source = readFileSync(fileURLToPath(new URL('../../../client/src/Client.ts', import.meta.url)), 'utf8');
    const declared = [...source.matchAll(/^ {2}(on[A-Z][A-Za-z0-9]+)\(\s*callback:/gm)].map((match) => match[1]);
    // Calls are hydrated by the client's own methods; a deleted-message listener is not implemented by the SDK.
    const handledElsewhere = new Set(['onIncomingCall', 'onCallState', 'onMessageDeleted']);

    expect(declared).toContain('onMessage');
    for (const name of declared.filter((listener) => !handledElsewhere.has(listener))) {
      expect(LISTENER_SOURCES[name]?.project, name).toBeTypeOf('function');
    }
  });
});

describe('remoteArguments', () => {
  it('treats an array or a class instance as a positional argument', () => {
    expect(remoteArguments('deleteStatus', [['a', 'b']])).toEqual([['a', 'b']]);
    expect(remoteArguments('sendText', [new Date(0)])).toEqual([new Date(0)]);
    expect(remoteArguments('rejectCall', [{ id: 'call-1', generation: 'g-1' }])).toEqual([{ id: 'call-1', generation: 'g-1' }]);
    expect(remoteArguments('rejectCall', [{ call: { id: 'call-1' } }])).toEqual({ call: { id: 'call-1' } });
  });

  it('accepts the documented key aliases as named parameters', () => {
    expect(remoteArguments('sendText', [{ chatId: CHAT, text: 'hello' }])).toEqual({ chatId: CHAT, text: 'hello' });
    expect(remoteArguments('pluginMethod', [{ anything: true }])).toEqual({ anything: true });
  });
});
