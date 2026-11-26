import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '../Client';
import { VOICE_NOTE_LIMITS, VOICE_NOTE_MAX_SOURCE_BYTES } from '../voiceNote';
import type { OpenWAClient, OpenWAEventMap, STATE, Transport } from '@open-wa/core';
import { HyperEmitter } from '@open-wa/hyperemitter';

const CHAT = '447700000000@c.us';
const SENT_ID = 'true_447700000000@c.us_3EB09833D447E37A1595B5';
const QUOTED_ID = 'false_447700000000@c.us_ACFFBBABB0397452EB3044DB86881362';

/** The sticker runtime the client binds to the page. A test replaces it to stand in for a page that converts. */
const runtime = vi.hoisted(() => ({ create: undefined as undefined | (() => unknown) }));
vi.mock('@open-wa/stickers', async importOriginal => {
  const original = await importOriginal<typeof import('@open-wa/stickers')>();
  return { ...original, createStickerRuntime: (options: never) => runtime.create ? runtime.create() : original.createStickerRuntime(options) };
});

/** The first page of an Ogg Opus file: the header that names the channel count. */
function oggOpus(channels: number, size = 64): Buffer {
  const bytes = Buffer.alloc(Math.max(size, 47));
  bytes.write('OggS', 0, 'ascii');
  bytes[5] = 2;
  bytes[26] = 1;
  bytes[27] = 19;
  bytes.write('OpusHead', 28, 'ascii');
  bytes[36] = 1;
  bytes[37] = channels;
  return bytes;
}
const MP3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(61, 7)]);
const CONVERTED = oggOpus(1, 80).fill(9, 47);

/** A client whose page calls run in this process, against whatever `WAPI` global the test installs. */
function createTestClient() {
  const events = new HyperEmitter<OpenWAEventMap>({ delimiter: '.', captureRejections: true });
  const openwaClient: OpenWAClient = {
    sessionId: 'test-session',
    events,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any,
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
  return new Client({ client: openwaClient, transport });
}

describe('voice notes', () => {
  let client: Client;
  let sendImage: ReturnType<typeof vi.fn>;
  let convertAudio: ReturnType<typeof vi.fn>;

  /** What the page was asked to send: the file's bytes and type, and the flags that follow it. */
  async function sent() {
    expect(sendImage).toHaveBeenCalledTimes(1);
    const [file, to, filename, caption, quotedMsgId, , ptt, asFile, , , , isGif, viewOnce] = sendImage.mock.calls[0]!;
    return { bytes: Buffer.from(await (file as File).arrayBuffer()), type: (file as File).type, to, filename, caption, quotedMsgId, ptt, asFile, isGif, viewOnce };
  }

  beforeEach(() => {
    client = createTestClient();
    sendImage = vi.fn(async () => SENT_ID);
    convertAudio = vi.fn(async () => ({ bytes: new Uint8Array(CONVERTED), mime: 'audio/ogg; codecs=opus', durationMs: 2000 }));
    runtime.create = () => ({ convertAudio, createSticker: vi.fn(), dispose: vi.fn() });
    vi.stubGlobal('WAPI', { sendImage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    runtime.create = undefined;
  });

  it('sendPtt sends mono Ogg Opus as it is', async () => {
    const voice = oggOpus(1);

    expect(await client.sendPtt(CHAT as any, voice)).toBe(SENT_ID);

    expect(convertAudio).not.toHaveBeenCalled();
    const message = await sent();
    expect(message.bytes.equals(voice)).toBe(true);
    expect(message).toMatchObject({ to: CHAT, type: 'audio/ogg', ptt: true, asFile: false, viewOnce: false });
  });

  it('sendPtt converts stereo Ogg Opus and keeps the reply and view-once options', async () => {
    const stereo = oggOpus(2);

    expect(await client.sendPtt(CHAT as any, stereo, { quotedMsgId: QUOTED_ID as any, viewOnce: true })).toBe(SENT_ID);

    expect(convertAudio).toHaveBeenCalledTimes(1);
    const [source, limits] = convertAudio.mock.calls[0]!;
    expect(Buffer.from(source as Uint8Array).equals(stereo)).toBe(true);
    expect(limits).toEqual({ maxSeconds: 600, maxBytes: 4_000_000, bitrate: 32_000 });
    expect(limits).toBe(VOICE_NOTE_LIMITS);
    const message = await sent();
    expect(message.bytes.equals(CONVERTED)).toBe(true);
    expect(message).toMatchObject({ type: 'audio/ogg', filename: 'media.ogg', ptt: true, quotedMsgId: QUOTED_ID, viewOnce: true, caption: '' });
  });

  it('sendPtt converts other audio, such as an MP3 data URL', async () => {
    await client.sendPtt(CHAT as any, `data:audio/mpeg;base64,${MP3.toString('base64')}`);

    expect(convertAudio).toHaveBeenCalledTimes(1);
    const message = await sent();
    expect(message.bytes.equals(CONVERTED)).toBe(true);
    expect(message).toMatchObject({ type: 'audio/ogg', filename: 'media.ogg', ptt: true });
  });

  it('sendFile converts a voice note too', async () => {
    await client.sendFile(CHAT as any, MP3, 'memo.mp3', { type: 'audio', ptt: true });

    expect(convertAudio).toHaveBeenCalledTimes(1);
    expect(await sent()).toMatchObject({ type: 'audio/ogg', filename: 'memo.ogg', ptt: true });
  });

  it('sendAudio never converts', async () => {
    const stereo = oggOpus(2);

    await client.sendAudio(CHAT as any, stereo);
    await client.sendAudio(CHAT as any, MP3, 'song.mp3');

    expect(convertAudio).not.toHaveBeenCalled();
    expect(sendImage).toHaveBeenCalledTimes(2);
    const [first, second] = sendImage.mock.calls.map(call => call[0] as File);
    expect(Buffer.from(await first!.arrayBuffer()).equals(stereo)).toBe(true);
    expect(Buffer.from(await second!.arrayBuffer()).equals(MP3)).toBe(true);
    expect(second!.type).toBe('audio/mpeg');
    expect(sendImage.mock.calls.every(call => call[6] === false)).toBe(true);
  });

  it('sendPtt still refuses a file that is not audio', async () => {
    const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(32)]);

    await expect(client.sendPtt(CHAT as any, png)).rejects.toThrow('Audio sending requires audio media.');

    expect(convertAudio).not.toHaveBeenCalled();
    expect(sendImage).not.toHaveBeenCalled();
  });

  it('names the length limit when the sound is too long', async () => {
    convertAudio.mockRejectedValue(Object.assign(new Error('audio: The sound is longer than 10 minutes.'), { code: 'AUDIO_FAILED', detail: { reason: 'AUDIO_TOO_LONG' } }));

    await expect(client.sendPtt(CHAT as any, MP3)).rejects.toThrow('A voice note that needs converting can be at most 10 minutes long. A mono Ogg Opus file is sent as it is.');

    expect(sendImage).not.toHaveBeenCalled();
  });

  it('names the size limit before handing a large file to the page', async () => {
    const large = Buffer.concat([MP3, Buffer.alloc(VOICE_NOTE_MAX_SOURCE_BYTES)]);

    await expect(client.sendPtt(CHAT as any, large)).rejects.toThrow('A voice note that needs converting can be at most 20 MB. A mono Ogg Opus file is sent as it is.');

    expect(convertAudio).not.toHaveBeenCalled();
    expect(sendImage).not.toHaveBeenCalled();
  });

  it('says to supply mono Ogg Opus when the page cannot convert', async () => {
    // The real runtime, on a page without audio encoding: this process has neither a canvas nor WebCodecs.
    runtime.create = undefined;

    await expect(client.sendPtt(CHAT as any, MP3)).rejects.toThrow("This session's browser cannot convert audio to a voice note. Supply a mono Ogg Opus file, which is sent as it is.");

    expect(sendImage).not.toHaveBeenCalled();
  });

  it('sends mono Ogg Opus on a page that cannot convert', async () => {
    runtime.create = undefined;

    expect(await client.sendPtt(CHAT as any, oggOpus(1))).toBe(SENT_ID);
    expect((await sent()).ptt).toBe(true);
  });
});
