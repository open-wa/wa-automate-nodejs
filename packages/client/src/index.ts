export { Client } from './Client';
export type { ClientConfig, EvaluateFn } from './Client';

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
} from '@open-wa/schema';
