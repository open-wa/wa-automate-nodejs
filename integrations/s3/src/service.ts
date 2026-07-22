import type { Logger } from '@open-wa/logger';
import { Context, Effect, Layer } from 'effect';
import type { S3Config } from './config.js';
import { S3Uploader } from './uploader.js';

export const S3UploaderService =
  Context.Service<S3Uploader>('@open-wa/integration-s3/S3Uploader');

export const s3UploaderTestLayer = (uploader: S3Uploader) =>
  Layer.succeed(S3UploaderService, uploader);

export const s3UploaderLayer = (
  config: S3Config,
  logger: Pick<Logger, 'error'>,
) => Layer.effect(
  S3UploaderService,
  Effect.acquireRelease(
    Effect.sync(() => new S3Uploader(config, logger)),
    (uploader) => Effect.promise(async () => {
      await uploader.waitForQueue();
      await uploader.close();
    }),
  ),
);
