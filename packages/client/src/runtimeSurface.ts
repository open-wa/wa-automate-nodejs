import type { ListenerHandle } from './events/index.js';

export type ClientRuntimeSupport = 'runtime' | 'unsupported';

export interface ClientRuntimeMethodSurfaceEntry {
  support: ClientRuntimeSupport;
  runtimeMethod?: string;
  reason?: string;
}

export interface ClientRuntimeListenerSurfaceEntry {
  support: ClientRuntimeSupport;
  runtimeSupportEvent?: string;
  reason?: string;
}

export const clientRuntimeMethodSurface = {
  sendText: { support: 'runtime', runtimeMethod: 'sendMessage' },
  sendImage: { support: 'runtime', runtimeMethod: 'sendImage' },
  sendFile: {
    support: 'unsupported',
    runtimeMethod: 'sendFile',
    reason: 'shipped wapi.js does not define window.WAPI.sendFile',
  },
  sendLocation: { support: 'runtime', runtimeMethod: 'sendLocation' },
  sendContact: { support: 'runtime', runtimeMethod: 'sendContact' },
  sendSticker: { support: 'runtime', runtimeMethod: 'sendImageAsSticker' },
  reply: { support: 'runtime', runtimeMethod: 'reply' },
  forwardMessages: { support: 'runtime', runtimeMethod: 'forwardMessages' },
  deleteMessage: { support: 'runtime', runtimeMethod: 'smartDeleteMessages' },
  editMessage: {
    support: 'unsupported',
    runtimeMethod: 'editMessage',
    reason: 'shipped wapi.js does not define window.WAPI.editMessage',
  },
  react: {
    support: 'unsupported',
    runtimeMethod: 'react',
    reason: 'shipped wapi.js does not define window.WAPI.react',
  },
  sendSeen: { support: 'runtime', runtimeMethod: 'sendSeen' },
  getMessageById: { support: 'runtime', runtimeMethod: 'getMessageById' },
  sendFileFromUrl: {
    support: 'unsupported',
    runtimeMethod: 'sendFile',
    reason: 'depends on window.WAPI.sendFile, which is not shipped',
  },
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
} as const satisfies Record<string, ClientRuntimeMethodSurfaceEntry>;

export const clientRuntimeListenerSurface = {
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
