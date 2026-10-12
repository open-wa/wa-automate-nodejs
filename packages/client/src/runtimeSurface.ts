import type { ListenerHandle } from './events/index';

export type ClientRuntimeSupport = 'runtime' | 'licensed' | 'unsupported';

export interface ClientRuntimeMethodSurfaceEntry {
  support: ClientRuntimeSupport;
  runtimeMethod?: string;
  runtimeSource?: 'asset' | 'live-patch';
  runtimePatch?: string;
  reason?: string;
}

export interface ClientRuntimeListenerSurfaceEntry {
  support: ClientRuntimeSupport;
  runtimeSupportEvent?: string;
  reason?: string;
}

export const clientRuntimeMethodSurface = {
  sendEvent: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'events', runtimeMethod: 'sendEvent' },
  getEvent: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'events', runtimeMethod: 'getEvent' },
  getEvents: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'events', runtimeMethod: 'getEvents' },
  getEventResponses: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'events', runtimeMethod: 'getEventResponses' },
  editEvent: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'events', runtimeMethod: 'editEvent' },
  cancelEvent: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'events', runtimeMethod: 'cancelEvent' },
  respondToEvent: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'events', runtimeMethod: 'respondToEvent' },
  getCallCapabilities: { support: 'runtime', reason: 'calling admission service' },
  getActiveCall: { support: 'licensed', reason: 'calling-enabled licensed provider' },
  startCall: { support: 'licensed', reason: 'calling-enabled licensed provider' },
  acceptCall: { support: 'licensed', reason: 'calling-enabled licensed provider' },
  rejectCall: { support: 'licensed', reason: 'calling-enabled licensed provider' },
  endCall: { support: 'licensed', reason: 'calling-enabled licensed provider' },
  muteCall: { support: 'licensed', reason: 'calling-enabled licensed provider' },
  clearCallAudio: { support: 'licensed', reason: 'calling-enabled licensed provider' },
  setCallMedia: { support: 'licensed', reason: 'calling-enabled licensed provider' },
  observeCallAudio: { support: 'licensed', reason: 'calling-enabled licensed provider' },
  stopCallAudioObserver: { support: 'licensed', reason: 'calling-enabled licensed provider' },
  sendInteractive: {
    support: 'licensed', runtimeMethod: 'sendInteractive',
    reason: 'provided by the server-confirmed Insiders license payload',
  },
  sendRawMessage: {
    support: 'licensed', runtimeMethod: 'sendRawMessage',
    reason: 'provided by the server-confirmed Insiders license payload',
  },
  sendText: { support: 'runtime', runtimeMethod: 'sendMessage' },
  sendImage: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'sendImage' },
  sendFile: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'sendImage', reason: 'generic media pipeline in the common patch' },
  sendAudio: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'sendImage' },
  sendPtt: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'sendImage' },
  sendVideoAsGif: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'sendImage' },
  voteOnPoll: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'voteOnPoll' },
  getPollResults: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'getPollResults' },
  pinMessage: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'pinMessage' },
  unpinMessage: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'pinMessage' },
  sendPoll: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'sendPoll', reason: 'provided by the common patch' },
  sendLocation: { support: 'runtime', runtimeMethod: 'sendLocation' },
  sendContact: { support: 'runtime', runtimeMethod: 'sendContact' },
  sendMultipleContacts: { support: 'runtime', runtimeMethod: 'sendContact' },
  sendVCard: { support: 'runtime', runtimeMethod: 'sendVCard' },
  sendSticker: { support: 'runtime', runtimeMethod: 'sendImageAsSticker' },
  reply: { support: 'runtime', runtimeMethod: 'reply' },
  forwardMessages: { support: 'runtime', runtimeMethod: 'forwardMessages' },
  deleteMessage: { support: 'runtime', runtimeMethod: 'smartDeleteMessages' },
  editMessage: { support: 'runtime', runtimeMethod: 'editMessage', reason: 'provided by the common patch' },
  react: { support: 'runtime', runtimeMethod: 'react', reason: 'provided by the common patch' },
  sendSeen: { support: 'runtime', runtimeMethod: 'sendSeen' },
  getMessageById: { support: 'runtime', runtimeMethod: 'getMessageById' },
  getAlbumMessages: { support: 'runtime', runtimeMethod: 'getAlbumMessages' },
  sendAlbum: { support: 'runtime', runtimeMethod: 'sendAlbum' },
  sendFileFromUrl: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'sendImage' },
  postTextStatus: { support: 'licensed', runtimeMethod: 'postTextStatus', reason: 'licensed text story payload' },
  postImageStatus: { support: 'licensed', runtimeMethod: 'postImageStatus', reason: 'licensed image story payload' },
  postVideoStatus: { support: 'licensed', runtimeMethod: 'postVideoStatus', reason: 'licensed video story payload' },
  decryptMedia: { support: 'runtime', reason: 'uses local decrypt flow plus getMessageById' },
  downloadMedia: { support: 'runtime', reason: 'uses local decrypt flow plus filesystem write' },
  createGroup: { support: 'runtime', runtimeMethod: 'createGroup' },
  addParticipant: { support: 'runtime', runtimeMethod: 'addParticipant' },
  removeParticipant: { support: 'runtime', runtimeMethod: 'removeParticipant' },
  promoteParticipant: { support: 'runtime', runtimeMethod: 'promoteParticipant' },
  demoteParticipant: { support: 'runtime', runtimeMethod: 'demoteParticipant' },
  setGroupTitle: {
    support: 'unsupported',
    runtimeMethod: 'setGroupTitle',
    reason: 'shipped wapi.js overrides window.WAPI.setGroupTitle with a placeholder that returns false',
  },
  setGroupDescription: {
    support: 'unsupported',
    runtimeMethod: 'setGroupDescription',
    reason: 'shipped wapi.js overrides window.WAPI.setGroupDescription with a placeholder that returns false',
  },
  setGroupIcon: { support: 'runtime', runtimeMethod: 'setGroupIcon' },
  getGroupInfo: {
    support: 'unsupported',
    runtimeMethod: 'getGroupInfo',
    reason: 'shipped wapi.js does not define window.WAPI.getGroupInfo',
  },
  getGroupMembers: { support: 'runtime', runtimeMethod: 'getGroupParticipantIDs' },
  getGroupMembersId: { support: 'runtime', runtimeMethod: 'getGroupParticipantIDs' },
  getGroupInviteLink: { support: 'runtime', runtimeMethod: 'getGroupInviteLink' },
  revokeGroupInviteLink: { support: 'runtime', runtimeMethod: 'revokeGroupInviteLink' },
  joinGroupViaLink: { support: 'runtime', runtimeMethod: 'joinGroupViaLink' },
  leaveGroup: { support: 'runtime', runtimeMethod: 'leaveGroup' },
  getChat: { support: 'runtime', runtimeMethod: 'getChat' },
  getAllChats: { support: 'runtime', runtimeMethod: 'getAllChats' },
  getChatById: { support: 'runtime', runtimeMethod: 'getChatById' },
  deleteChat: { support: 'runtime', runtimeMethod: 'deleteConversation' },
  clearChat: { support: 'runtime', runtimeMethod: 'clearChat' },
  archiveChat: { support: 'runtime', runtimeMethod: 'archiveChat' },
  unarchiveChat: { support: 'runtime', runtimeMethod: 'archiveChat' },
  pinChat: {
    support: 'unsupported',
    runtimeMethod: 'pinChat',
    reason: 'shipped wapi.js does not define window.WAPI.pinChat',
  },
  unpinChat: {
    support: 'unsupported',
    runtimeMethod: 'pinChat',
    reason: 'shipped wapi.js does not define window.WAPI.pinChat',
  },
  muteChat: {
    support: 'unsupported',
    runtimeMethod: 'muteChat',
    reason: 'shipped wapi.js does not define window.WAPI.muteChat',
  },
  unmuteChat: {
    support: 'unsupported',
    runtimeMethod: 'unmuteChat',
    reason: 'shipped wapi.js does not define window.WAPI.unmuteChat',
  },
  markAsUnread: { support: 'runtime', runtimeMethod: 'markAsUnread' },
  getAllMessages: { support: 'runtime', runtimeMethod: 'getAllMessagesInChat' },
  loadEarlierMessages: { support: 'runtime', runtimeMethod: 'loadEarlierMessages' },
  getContact: { support: 'runtime', runtimeMethod: 'getContact' },
  requestPhoneNumber: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'requestPhoneNumber' },
  sharePhoneNumber: { support: 'runtime', runtimeSource: 'live-patch', runtimePatch: 'message-options', runtimeMethod: 'sharePhoneNumber' },
  getAllContacts: { support: 'runtime', runtimeMethod: 'getAllContacts' },
  getContactById: { support: 'runtime', runtimeMethod: 'getContact' },
  checkNumberStatus: { support: 'runtime', runtimeMethod: 'checkNumberStatus' },
  getProfilePic: { support: 'runtime', runtimeMethod: 'getProfilePicFromServer' },
  blockContact: { support: 'runtime', runtimeMethod: 'contactBlock' },
  unblockContact: { support: 'runtime', runtimeMethod: 'contactUnblock' },
  getBlockedContacts: {
    support: 'unsupported',
    runtimeMethod: 'getBlockedIds',
    reason: 'shipped wapi.js overrides window.WAPI.getBlockedIds with a placeholder that returns false',
  },
  getCommonGroups: {
    support: 'unsupported',
    runtimeMethod: 'getCommonGroups',
    reason: 'shipped wapi.js overrides window.WAPI.getCommonGroups with a placeholder that returns false',
  },
  getLastSeen: { support: 'runtime', runtimeMethod: 'getLastSeen' },
  isChatOnline: { support: 'runtime', runtimeMethod: 'isChatOnline' },
  getHostNumber: { support: 'runtime', runtimeMethod: 'getHostNumber' },
  getWAVersion: { support: 'runtime', runtimeMethod: 'getWAVersion' },
  getConnectionState: {
    support: 'unsupported',
    runtimeMethod: 'getConnectionState',
    reason: 'shipped wapi.js does not define window.WAPI.getConnectionState',
  },
  getBatteryLevel: { support: 'runtime', runtimeMethod: 'getBatteryLevel' },
  getIsPlugged: { support: 'runtime', runtimeMethod: 'getIsPlugged' },
  getAmountOfLoadedMessages: { support: 'runtime', runtimeMethod: 'getAmountOfLoadedMessages' },
  getMe: { support: 'runtime', runtimeMethod: 'getMe' },
  getFeatures: {
    support: 'unsupported',
    runtimeMethod: 'getFeatures',
    reason: 'shipped wapi.js does not define window.WAPI.getFeatures',
  },
  getProcessStats: {
    support: 'unsupported',
    runtimeMethod: 'getProcessStats',
    reason: 'shipped wapi.js does not define window.WAPI.getProcessStats',
  },
  setMyName: { support: 'runtime', runtimeMethod: 'setMyName' },
  setMyStatus: { support: 'runtime', runtimeMethod: 'setMyStatus' },
} as const satisfies Record<string, ClientRuntimeMethodSurfaceEntry>;

export const clientRuntimeListenerSurface = {
  onPollVote: { support: 'runtime', runtimeSupportEvent: 'poll.vote' },
  onEvent: { support: 'runtime', runtimeSupportEvent: 'event.changed' },
  onEventResponse: { support: 'runtime', runtimeSupportEvent: 'event.response' },
  onIncomingCall: { support: 'licensed', runtimeSupportEvent: 'call.incoming' },
  onCallState: { support: 'licensed', runtimeSupportEvent: 'call.state' },
  onInteractiveResponse: { support: 'runtime', runtimeSupportEvent: 'interactive.response' },
  onFormResponse: { support: 'runtime', runtimeSupportEvent: 'interactive.response' },
  onMessage: { support: 'runtime', runtimeSupportEvent: 'message.received' },
  onAck: { support: 'runtime', runtimeSupportEvent: 'ack.changed' },
  onStateChanged: { support: 'runtime', runtimeSupportEvent: 'session.state.changed' },
  onAnyMessage: { support: 'runtime', runtimeSupportEvent: 'message.any' },
  onMessageDeleted: {
    support: 'unsupported',
    reason: 'client listener expects message.deleted, but the shipped transport/runtime surface does not register any deletion bridge',
  },
  onLogout: { support: 'runtime', runtimeSupportEvent: 'session.logout' },
} as const satisfies Record<string, ClientRuntimeListenerSurfaceEntry>;

export function createUnsupportedRuntimeSurfaceError(kind: 'method' | 'listener', name: string, reason: string): Error {
  return new Error(`Client ${kind} "${name}" is not supported by the shipped browser runtime: ${reason}`);
}

export function createUnsupportedMethodStub<T extends (...args: any[]) => unknown>(
  name: keyof typeof clientRuntimeMethodSurface,
): T {
  const entry = clientRuntimeMethodSurface[name] as ClientRuntimeMethodSurfaceEntry;
  const reason = entry.reason ?? 'no shipped runtime backing is available';

  return ((..._args: Parameters<T>) => {
    throw createUnsupportedRuntimeSurfaceError('method', name, reason);
  }) as unknown as T;
}

export function throwUnsupportedListener(name: keyof typeof clientRuntimeListenerSurface): ListenerHandle {
  const entry = clientRuntimeListenerSurface[name] as ClientRuntimeListenerSurfaceEntry;
  const reason = entry.reason ?? 'no shipped runtime backing is available';
  throw createUnsupportedRuntimeSurfaceError('listener', name, reason);
}
