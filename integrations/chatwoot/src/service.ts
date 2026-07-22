import type { Logger } from '@open-wa/logger';
import { Context, Effect, Layer } from 'effect';
import { ChatwootClient } from './client';
import type { ChatwootConfig } from './config';

export const ChatwootClientService =
  Context.Service<ChatwootClient>('@open-wa/integration-chatwoot/ChatwootClient');

export const chatwootClientTestLayer = (client: ChatwootClient) =>
  Layer.succeed(ChatwootClientService, client);

export const chatwootClientLayer = (
  config: ChatwootConfig,
  logger: Pick<Logger, 'debug' | 'info' | 'error'>,
) => Layer.effect(
  ChatwootClientService,
  Effect.acquireRelease(
    Effect.sync(() => new ChatwootClient(config, logger)),
    () => Effect.void,
  ),
);
