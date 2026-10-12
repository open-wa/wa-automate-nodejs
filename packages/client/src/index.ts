export { Client } from './Client';
export { hydrateCall } from './calls';
export type { CallActions } from './calls';
export { DEFAULT_MIC, DEFAULT_SPEAKER, DEFAULT_CAM } from '@open-wa/schema';
export type { Call, CallSnapshot, CallEndReason, CallActionResult, CallCapabilities, CallAudioObserver, CallMediaOptions, CallingOptions, AudioInput, AudioOutput, VideoInput, MediaDescriptor, RawAudioFormat } from '@open-wa/schema';
export type { ClientConfig, EvaluateFn } from './Client';
export type { LicenseFeatures } from '@open-wa/schema';
export { SendTextError } from './SendTextError';
export type { SendTextErrorCode, SendTextOutcome } from './SendTextError';
export { SendStickerError } from './SendStickerError';
export type { StickerInput, StickerJob, StickerEffect, StickerResult } from '@open-wa/stickers';

export type { MessagingMethods } from './methods/messaging';
export type { MediaMethods } from './methods/media';
export type { StatusMethods } from './methods/status';
export type { MediaInput, MediaSendResult } from './mediaInput';
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
  GroupInfo,
  ParticipantChange,
  DataURL,
  Base64,
  Content,
  AlbumMedia,
  AlbumSendResult,
} from '@open-wa/schema';

export type { InteractiveMethods } from './methods/interactive';
export type { WhatsAppEventMethods } from './methods/whatsapp-events';
export { EventInputSchema, EventUpdateSchema, WhatsAppEventSchema, EventResponseSchema, EventResponseTypeSchema, EventListOptionsSchema, EventPageSchema, serializeWhatsAppEvent, deserializeWhatsAppEvent, serializeEventResponse, deserializeEventResponse } from '@open-wa/schema';
export type { EventInput, EventUpdate, WhatsAppEvent, EventResponse, EventResponseType, EventPage, EventListOptions } from '@open-wa/schema';
export { defineInteractiveMessage, InteractiveContentSchema, InteractiveResponseSchema, FormResponseSchema } from '@open-wa/schema';
export type { InteractiveContent, InteractiveAction, InteractiveHeader, FormQuestion, InteractiveResponse, FormResponse, JsonValue } from '@open-wa/schema';

export { MediaSendOptionsSchema, PollSendOptionsSchema, PollVoteSchema, PollResultsSchema } from '@open-wa/schema';
export type { MediaSendOptions, ImageSendOptions, VideoSendOptions, AudioSendOptions, AudioAttachmentOptions, VoiceNoteOptions, GifSendOptions, PollSendOptions, PollVote, PollResults, PinDuration } from '@open-wa/schema';
