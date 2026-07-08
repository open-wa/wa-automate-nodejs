import { Data, Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { OpenWAError, runToPromise, toPublicError } from '../../src/effect/errors.js';

class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly message: string;
  readonly details?: unknown;
}> {}

class CustomStatusError extends Data.TaggedError('CustomStatusError')<{
  readonly message: string;
  readonly status: number;
}> {}

describe('toPublicError', () => {
  it('maps a known tag to its default status and preserves the message', () => {
    const err = toPublicError(new ValidationError({ message: 'bad input', details: { field: 'to' } }));
    expect(err).toBeInstanceOf(OpenWAError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ValidationError');
    expect(err.status).toBe(400);
    expect(err.message).toBe('bad input');
    expect(err.details).toEqual({ field: 'to' });
  });

  it('prefers an explicit status on the tagged error', () => {
    const err = toPublicError(new CustomStatusError({ message: 'teapot', status: 418 }));
    expect(err.name).toBe('CustomStatusError');
    expect(err.status).toBe(418);
  });

  it('defaults unknown tags to 500', () => {
    class WeirdError extends Data.TaggedError('WeirdError')<{ readonly message: string }> {}
    expect(toPublicError(new WeirdError({ message: 'x' })).status).toBe(500);
  });

  it('wraps a plain Error', () => {
    const err = toPublicError(new Error('boom'));
    expect(err.name).toBe('OpenWAError');
    expect(err.status).toBe(500);
    expect(err.message).toBe('boom');
    expect((err as Error & { cause?: unknown }).cause).toBeInstanceOf(Error);
  });

  it('wraps a non-error value', () => {
    expect(toPublicError('nope').message).toBe('nope');
    expect(toPublicError(42).message).toBe('Unknown error');
  });

  it('is idempotent for OpenWAError', () => {
    const original = toPublicError(new ValidationError({ message: 'x' }));
    expect(toPublicError(original)).toBe(original);
  });
});

describe('runToPromise', () => {
  it('resolves successful effects', async () => {
    await expect(runToPromise(Effect.succeed(7))).resolves.toBe(7);
  });

  it('rejects with a public OpenWAError for a tagged failure', async () => {
    await expect(
      runToPromise(Effect.fail(new ValidationError({ message: 'bad' }))),
    ).rejects.toMatchObject({ name: 'ValidationError', status: 400, message: 'bad' });
  });

  it('never leaks the raw effect failure type', async () => {
    try {
      await runToPromise(Effect.fail(new ValidationError({ message: 'bad' })));
      throw new Error('should have rejected');
    } catch (err) {
      expect(err).toBeInstanceOf(OpenWAError);
    }
  });
});
