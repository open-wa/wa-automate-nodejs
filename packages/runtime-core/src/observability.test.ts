import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { makeInMemoryObservability } from './observability';

describe('runtime observability', () => {
  it('retains nested causes as structured diagnostic data', async () => {
    const observability = makeInMemoryObservability();
    const root = new Error('socket reset');
    const outer = new Error('browser launch failed', { cause: root });

    await Effect.runPromise(observability.recordCause('browser.launch', outer, {
      session: 'test-session',
    }));

    const causes = await Effect.runPromise(observability.causes);
    expect(causes).toMatchObject([{
      scope: 'browser.launch',
      attributes: { session: 'test-session' },
      cause: {
        name: 'Error',
        message: 'browser launch failed',
        cause: { name: 'Error', message: 'socket reset' },
      },
    }]);
    await expect(Effect.runPromise(observability.snapshot)).resolves.toMatchObject({
      'cause_failures{scope=browser.launch,session=test-session}': 1,
    });
  });
});
