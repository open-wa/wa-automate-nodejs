export { Client } from './Client.js';
export type { ClientConfig, EvaluateFn } from './Client.js';

export type { MessagingMethods } from './methods/messaging.js';
export type { MediaMethods } from './methods/media.js';
export type { GroupMethods } from './methods/groups.js';
export type { ChatMethods } from './methods/chats.js';
export type { ContactMethods } from './methods/contacts.js';

export {
  MessageCollector,
  MessageCollectorOptions,
  MessageCollectorEvents,
  AwaitMessagesOptions,
  awaitMessages,
  Collector,
  Collection,
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
} from '@open-wa/schema';
