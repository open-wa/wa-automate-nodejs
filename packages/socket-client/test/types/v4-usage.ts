// Checked by `tsc` against the built package (dist), not the sources.
//
// The first function holds the calls a user reported as type errors after
// moving from v4 (Discord, 2026-11-26). The rest pin down the types those
// calls now rely on.
import { SocketClient, type Client, type ListenerPayloads } from '@open-wa/socket-client';
import { SimpleListener, type Message } from '@open-wa/wa-automate-types-only';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
function expectType<T>(_value: T): void {}
const yes = true as const;

export async function reported() {
  // The object `connect` resolves to is typed as the client itself, with no intersection or cast.
  const client = await SocketClient.connect('http://localhost:8080');

  // 1. A typed listener registered through the enum.
  await client.listen(SimpleListener.Message, async (message: Message) => {
    expectType<string>(message.body);
  });

  // 2. The v4-style string name.
  await client.listen('onMessage', async (message: Message) => {
    expectType<string>(message.body);
  });

  // 3. Direct methods with positional arguments, as on the v4 Client.
  const sent = await client.sendText('447700900123@c.us', 'hello');
  expectType<string>(sent);
  await client.sendReplyWithMentions('447700900123@c.us', 'hello @447700900124', 'false_447700900123@c.us_ABC');
  await client.sendReplyWithMentions('447700900123@c.us', 'hello', 'false_447700900123@c.us_ABC', true, ['447700900124@c.us']);
}

export async function listeners(client: SocketClient) {
  // An unannotated handler gets the payload type from the listener name.
  await client.listen('onMessage', (message) => expectType<Message>(message));
  await client.listen(SimpleListener.AnyMessage, (message) => expectType<Message>(message));
  await client.listen('onAck', (message) => expectType<Message>(message));
  await client.listen(SimpleListener.StateChanged, (state) => expectType<string>(state));
  await client.listen('onLogout', (logout) => expectType<number>(logout.timestamp));
  await client.listen('onGlobalParticipantsChanged', (change) => expectType<string>(change.action));
  await client.listen('onPollVote', (vote) => expectType<ListenerPayloads['onPollVote']>(vote));

  // The listener methods of the SDK Client exist with the same payloads.
  const id = await client.onMessage((message) => expectType<Message>(message));
  expectType<string>(id);
  await client.onAnyMessage(async (message) => expectType<Message>(message));
  await client.onStateChanged((state) => expectType<string>(state));
  await client.onParticipantsChanged('120363000000000000@g.us', (change) => expectType<string>(change.action));
  await client.onIncomingCall((call) => expectType<string>(call.id));
  client.stopListener('onMessage', id);
  client.stopListener(SimpleListener.Message, id);

  // A listener the SDK Client does not define keeps an untyped payload.
  await client.listen(SimpleListener.Battery, (data) => expectType<unknown>(data));
  // So does an Easy API stream event addressed by its own name.
  await client.listen('message.received', (payload) => expectType<unknown>(payload));

  // The wire envelope is not what a listener receives.
  // @ts-expect-error onMessage delivers the message, not `{ message }`.
  await client.listen('onMessage', (payload: { message: Message }) => void payload);
  // @ts-expect-error a handler for the wrong payload is rejected.
  await client.listen(SimpleListener.Message, (state: number) => void state);
}

export async function methods(client: SocketClient) {
  // Named parameters and positional arguments are both typed.
  await client.sendText({ to: '447700900123@c.us', content: 'hello' });
  await client.sendText('447700900123@c.us', 'hello');
  await client.sendImage('447700900123@c.us', 'https://example.com/a.png', 'a.png', { caption: 'A' });
  await client.sendLocation({ to: '447700900123@c.us', lat: 51.5, lng: -0.12, loc: 'London' });
  expectType<boolean>(await client.sendSeen('447700900123@c.us'));
  await client.getAllChats();
  await client.getAllChats(true);
  // An alias has the signature of the method it names.
  await client.sendVoiceNote('447700900123@c.us', 'https://example.com/a.ogg');

  // @ts-expect-error content is required.
  await client.sendText('447700900123@c.us');
  // @ts-expect-error content must be a string.
  await client.sendText('447700900123@c.us', 42);
  // @ts-expect-error `text` is not a parameter of sendText.
  await client.sendText({ to: '447700900123@c.us', text: 'hello' });
  // @ts-expect-error there is no such method.
  await client.sendTextt('447700900123@c.us', 'hello');

  // `ask` takes the same named parameters, or the positional arguments as an array.
  expectType<string>(await client.ask('sendText', { to: '447700900123@c.us', content: 'hello' }));
  await client.ask('sendText', ['447700900123@c.us', 'hello']);
  await client.ask('sendReplyWithMentions', { to: '447700900123@c.us', content: 'hello', replyMessageId: 'false_447700900123@c.us_ABC' });
  await client.ask('getAllChats');
  // @ts-expect-error replyMessageId is required.
  await client.ask('sendReplyWithMentions', { to: '447700900123@c.us', content: 'hello' });
  // A method this package has no types for can still be called by name.
  expectType<unknown>(await client.ask('somePluginMethod', { anything: true }));
}

// Code written against v4's `SocketClient & Client` return type still compiles.
export async function v4Annotations() {
  const client: SocketClient & Client = await SocketClient.connect('http://localhost:8080', 'api-key');
  await client.sendText('447700900123@c.us', 'hello');
  const helper = new Helper(client);
  await helper.reply('447700900123@c.us', 'hello');
}

// A client stored on a plain `SocketClient` field keeps its methods.
class Helper {
  constructor(private readonly client: SocketClient) {}
  reply(to: string, body: string) {
    return this.client.sendText(to, body);
  }
}

expectType<Equal<Parameters<SocketClient['sendText']>, [to: string, content: string, options?: unknown]>>(yes);
expectType<Equal<ListenerPayloads['onMessage'], Message>>(yes);
