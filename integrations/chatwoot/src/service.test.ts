import { ManagedRuntime } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { ChatwootClient } from './client';
import { ChatwootClientService, chatwootClientLayer } from './service';

describe('ChatwootClient Layer', () => {
  it('automatically aborts requests and clears registries on scope close', async () => {
    const close = vi.spyOn(ChatwootClient.prototype, 'close');
    const runtime = ManagedRuntime.make(chatwootClientLayer({
      chatwootUrl: 'https://chatwoot.example/app/accounts/1/inboxes/2',
      chatwootApiAccessToken: 'test-token',
    }, {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    }));

    await runtime.runPromise(ChatwootClientService);
    await runtime.dispose();

    expect(close).toHaveBeenCalledTimes(1);
    close.mockRestore();
  });
});
