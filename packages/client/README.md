# @open-wa/client

`@open-wa/client` provides the in-process TypeScript client for a WhatsApp Web session. It wraps the client created by `@open-wa/core`. For a remote HTTP server, use `@open-wa/socket-client`.

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Install

```bash
bun add @open-wa/client @open-wa/core @open-wa/driver-puppeteer
```

## Start a session and send a message

```typescript
import { Client } from '@open-wa/client';
import { createClient } from '@open-wa/core';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';

const session = await createClient({
  sessionId: 'main-session',
  driver: new PuppeteerDriver(),
});
const client = new Client({ client: session, transport: session.getTransport() });

await client.start();
await client.sendText('447700900123@c.us', 'Hello from Open-WA');

await client.stop();
```

The client starts the browser session in your process. See the [custom code guide](https://openwa.dev/docs/getting-started/custom-code) for authentication and browser-profile setup.

## Text send results

`sendText(chatId, content)` resolves to a validated serialized `MessageId` string, including when the runtime returns an object containing `_serialized`. A returned ID is not a delivery or read receipt. Failures throw the exported `SendTextError`, whose `code` explains the failure and whose `outcome` distinguishes a rejected send from an uncertain attempt.

| Code | Outcome | Meaning |
| --- | --- | --- |
| `INVALID_ARGUMENT` | `not_sent` | The chat ID or text is missing or is not a string; no browser call was made. |
| `LICENSE_REQUIRED` | `not_sent` | Starting this chat requires an applied restricted or premium license. |
| `SEND_REJECTED` | `not_sent` | The runtime rejected the unsupported broadcast recipient. |
| `INVALID_SEND_RESULT` | `unknown` | The runtime returned no usable message ID, including `false` or an unrecognized failure value. |
| `SEND_FAILED` | `unknown` | Browser evaluation failed; the original error is available as `cause`. |

For an `unknown` outcome, check the chat before deciding whether to send again. The client never retries automatically because the first attempt may already have sent the message.

## Media and patch-backed messages

Media methods accept a data URL, base64 string, URL, local path or `Buffer`. `sendFile` uses the detected media type, so a video appears as a video and an audio file appears as audio. It does not force every file into a document attachment.

```typescript
await client.sendFile(chatId, './clip.mp4', 'clip.mp4', { caption: 'Watch this' });
await client.sendAudio(chatId, './sound.mp3', 'sound.mp3');
await client.sendPtt(chatId, './voice.ogg', { viewOnce: true });
await client.sendFile(chatId, './note.mp4', 'note.mp4', { type: 'video', videoNote: true });
await client.sendVideoAsGif(chatId, './loop.mp4', 'loop.mp4');
await client.sendFileFromUrl(chatId, downloadUrl, 'clip.mp4', {}, { Authorization: token });
await client.sendPoll(chatId, 'Which day?', ['Friday', 'Saturday', 'Sunday'], { selectableCount: 2 });
await client.pinMessage(messageId, 'SevenDays');
await client.react(messageId, '👍');
await client.editMessage(messageId, 'Updated text');
```

`sendPtt` marks prepared audio as a voice note; it does not transcode the source. `sendVideoAsGif` accepts video and enables WhatsApp's looping GIF presentation. Media and poll sends return a serialized message ID or a boolean submission result. Neither confirms recipient delivery; an uncertain result should be checked in the chat before retrying.

`sendVCard(chatId, vcard, contactName?, contactNumber?)` sends supplied vCard content. `sendMultipleContacts(chatId, contactIds)` sends one contact bundle, while `sendContact` sends each supplied contact separately and returns the individual results.

`postTextStatus(text, backgroundColor?, font?)`, `postImageStatus(image, caption?)` and `postVideoStatus(video, caption?)` use the corresponding licensed story payloads. Text backgrounds accept RGB or RGBA hex colors, and fonts are numbered 0–5. Missing common or licensed methods produce an error when called; these methods require the current patch delivery.

## Documentation

See the [custom code guide](https://openwa.dev/docs/getting-started/custom-code) for setup and [how Open-WA works](https://openwa.dev/docs/concepts/how-it-works) for the package roles.

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) — Hippocratic + Do Not Harm

Media settings use the shared `MediaSendOptions` contract. Set `type: 'video'` for `isGif` or `videoNote`, `type: 'audio'` for `ptt`, or `type: 'document'` to force a document attachment. Circular notes require prepared square MP4 video of at most 60 seconds. See the media guide for allowed combinations. Polls expose `voteOnPoll`, `getPollResults` and `onPollVote`; optional `endTime` uses Unix milliseconds and `hideVoterNames` requires native sending-account support.
