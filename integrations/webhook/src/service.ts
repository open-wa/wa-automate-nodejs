import type { Logger } from '@open-wa/logger';
import { Context, Effect, Layer } from 'effect';
import type { WebhookConfig } from './config.js';
import { WebhookDeliverer } from './deliverer.js';

export const WebhookDelivererService =
  Context.Service<WebhookDeliverer>('@open-wa/integration-webhook/WebhookDeliverer');

export const webhookDelivererTestLayer = (deliverer: WebhookDeliverer) =>
  Layer.succeed(WebhookDelivererService, deliverer);

export const webhookDelivererLayer = (
  config: WebhookConfig,
  logger: Pick<Logger, 'debug' | 'warn' | 'error'>,
) => Layer.effect(
  WebhookDelivererService,
  Effect.acquireRelease(
    Effect.sync(() => new WebhookDeliverer(config, logger)),
    (deliverer) => Effect.promise(async () => {
      await deliverer.waitForIdle();
      await deliverer.close();
    }),
  ),
);
