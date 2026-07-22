import { ManagedRuntime } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { WebhookDelivererService, webhookDelivererLayer } from './service';

describe('WebhookDeliverer Layer', () => {
  it('automatically releases the queue when its managed scope closes', async () => {
    const runtime = ManagedRuntime.make(webhookDelivererLayer({
      url: 'https://example.test/webhook',
      retries: 0,
    }, {
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as never));
    const deliverer = await runtime.runPromise(WebhookDelivererService);

    await runtime.dispose();

    await expect(deliverer.deliver({
      webhookId: 'webhook-1',
      sessionId: 'session-1',
      event: 'message.received',
      payload: {},
      timestamp: 1,
    })).rejects.toThrow('closed');
  });
});
