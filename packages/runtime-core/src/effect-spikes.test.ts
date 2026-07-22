import { Effect, Schema } from 'effect';
import { describe, expect, it } from 'vitest';
import { HttpApi } from 'effect/unstable/httpapi';
import {
  OpenWaAskRpc,
  OpenWaHttpApi,
  RuntimeEventSchema,
  decodeRuntimeEvent,
} from './effect-spikes.js';

describe('Effect replacement spikes', () => {
  it('decodes runtime events with Effect Schema', async () => {
    const decoded = await Effect.runPromise(decodeRuntimeEvent({
      event: 'message.received',
      sessionId: 'session',
      timestamp: 1,
      payload: { body: 'hello' },
    }));
    expect(decoded.event).toBe('message.received');
    expect(() => Schema.decodeUnknownSync(RuntimeEventSchema)({ timestamp: 'bad' })).toThrow();
  });

  it('describes HTTP and RPC contracts without transport implementations', () => {
    const endpoints: string[] = [];
    HttpApi.reflect(OpenWaHttpApi, {
      onGroup: () => undefined,
      onEndpoint: ({ endpoint }) => endpoints.push(endpoint.identifier),
    });
    expect(endpoints).toEqual(['health']);
    expect(OpenWaAskRpc._tag).toBe('openwa.ask');
    expect(OpenWaAskRpc.payloadSchema).toBeDefined();
  });
});
