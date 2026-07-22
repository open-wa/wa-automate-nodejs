import { ManagedRuntime } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { S3UploaderService, s3UploaderLayer } from './service';
import { S3Uploader } from './uploader';

describe('S3Uploader Layer', () => {
  it('drains and closes its queue when the managed scope closes', async () => {
    const waitForQueue = vi.spyOn(S3Uploader.prototype, 'waitForQueue');
    const close = vi.spyOn(S3Uploader.prototype, 'close');
    const runtime = ManagedRuntime.make(s3UploaderLayer({
      provider: 'aws',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      bucket: 'test-bucket',
    }, { error: vi.fn() }));

    await runtime.runPromise(S3UploaderService);
    await runtime.dispose();

    expect(waitForQueue).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    waitForQueue.mockRestore();
    close.mockRestore();
  });
});
