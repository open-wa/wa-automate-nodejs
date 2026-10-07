export { Client } from './Client';
export type { ClientConfig, EvaluateFn } from './Client';
export { SendTextError } from './SendTextError';
export type { SendTextErrorCode, SendTextOutcome } from './SendTextError';

export type { MessagingMethods } from './methods/messaging';
export type { MediaMethods } from './methods/media';
export type { GroupMethods } from './methods/groups';
export type { ChatMethods } from './methods/chats';
export type { ContactMethods } from './methods/contacts';

export {
  MessageCollector,
  awaitMessages,
  Collector,
  Collection,
} from '@open-wa/domain';

export type {
  MessageCollectorOptions,
  MessageCollectorEvents,
  AwaitMessagesOptions,
  CollectorFilter,
  CollectorOptions,
} from '@open-wa/domain';

export type {
  ChatId,
  ContactId,
  GroupId,
  MessageId,
  Message,
  Chat,
  Contact,
  GroupMetadata,
  DataURL,
  Base64,
  Content,
  AlbumMedia,
  AlbumSendResult,
} from '@open-wa/schema';

export type { InteractiveMethods } from './methods/interactive';
export { defineInteractiveMessage, InteractiveContentSchema, InteractiveResponseSchema, FormResponseSchema } from '@open-wa/schema';
export type { InteractiveContent, InteractiveAction, InteractiveHeader, FormQuestion, InteractiveResponse, FormResponse, JsonValue } from '@open-wa/schema';
