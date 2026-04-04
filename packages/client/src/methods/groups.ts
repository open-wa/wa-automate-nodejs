import type { Client } from '../Client.js';
import type {
  ChatId,
  GroupId,
  ContactId,
  GroupMetadata,
  Chat,
  DataURL,
} from '@open-wa/schema';
import { createUnsupportedMethodStub } from '../runtimeSurface.js';

declare const WAPI: {
  createGroup: (groupName: string, contactId: string | string[]) => Promise<any>;
  addParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  removeParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  promoteParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  demoteParticipant: (groupId: string, contactId: string) => Promise<boolean | string>;
  setGroupTitle: (groupId: string, title: string) => Promise<boolean>;
  setGroupDescription: (groupId: string, description: string) => Promise<boolean>;
  setGroupIcon: (groupId: string, imgData: string) => Promise<boolean>;
  getGroupInfo: (groupId: string) => Promise<GroupMetadata>;
  getGroupParticipantIDs: (groupId: string) => Promise<string[]>;
  getGroupInviteLink: (groupId: string) => Promise<string>;
  revokeGroupInviteLink: (groupId: string) => Promise<string | boolean>;
  joinGroupViaLink: (link: string, returnChatObj?: boolean) => Promise<string | boolean | number | Chat>;
  leaveGroup: (groupId: string) => Promise<any>;
};

export interface GroupMethods {
  createGroup(name: string, participants: ContactId | ContactId[]): Promise<{ gid: GroupId } | null>;
  addParticipant(groupId: GroupId, participant: ContactId): Promise<boolean>;
  removeParticipant(groupId: GroupId, participant: ContactId): Promise<boolean>;
  promoteParticipant(groupId: GroupId, participant: ContactId): Promise<boolean>;
  demoteParticipant(groupId: GroupId, participant: ContactId): Promise<boolean>;
  setGroupTitle(groupId: GroupId, title: string): Promise<boolean>;
  setGroupDescription(groupId: GroupId, description: string): Promise<boolean>;
  setGroupIcon(groupId: GroupId, image: DataURL): Promise<boolean>;
  getGroupInfo(groupId: GroupId): Promise<GroupMetadata | null>;
  getGroupMembers(groupId: GroupId): Promise<ContactId[]>;
  getGroupInviteLink(groupId: GroupId): Promise<string>;
  revokeGroupInviteLink(groupId: GroupId): Promise<string | boolean>;
  joinGroupViaLink(inviteLink: string): Promise<GroupId | boolean>;
  leaveGroup(groupId: GroupId): Promise<boolean>;
}

export function groupMethods(client: Client): GroupMethods {
  const evaluate = client.evaluate.bind(client);
  const unsupportedSetGroupTitle = createUnsupportedMethodStub<GroupMethods['setGroupTitle']>('setGroupTitle');
  const unsupportedSetGroupDescription = createUnsupportedMethodStub<GroupMethods['setGroupDescription']>('setGroupDescription');
  const unsupportedGetGroupInfo = createUnsupportedMethodStub<GroupMethods['getGroupInfo']>('getGroupInfo');
  
  return {
    async createGroup(name: string, participants: ContactId | ContactId[]): Promise<{ gid: GroupId } | null> {
      return evaluate(
        ({ name, participants }) => WAPI.createGroup(name, participants),
        { name, participants }
      );
    },
    
    async addParticipant(groupId: GroupId, participant: ContactId): Promise<boolean> {
      const result = await evaluate(
        ({ groupId, participant }) => WAPI.addParticipant(groupId, participant),
        { groupId, participant }
      );
      return result === true;
    },
    
    async removeParticipant(groupId: GroupId, participant: ContactId): Promise<boolean> {
      const result = await evaluate(
        ({ groupId, participant }) => WAPI.removeParticipant(groupId, participant),
        { groupId, participant }
      );
      return result === true;
    },
    
    async promoteParticipant(groupId: GroupId, participant: ContactId): Promise<boolean> {
      const result = await evaluate(
        ({ groupId, participant }) => WAPI.promoteParticipant(groupId, participant),
        { groupId, participant }
      );
      return result === true;
    },
    
    async demoteParticipant(groupId: GroupId, participant: ContactId): Promise<boolean> {
      const result = await evaluate(
        ({ groupId, participant }) => WAPI.demoteParticipant(groupId, participant),
        { groupId, participant }
      );
      return result === true;
    },
    
    async setGroupTitle(groupId: GroupId, title: string): Promise<boolean> {
      return unsupportedSetGroupTitle(groupId, title);
    },
    
    async setGroupDescription(groupId: GroupId, description: string): Promise<boolean> {
      return unsupportedSetGroupDescription(groupId, description);
    },
    
    async setGroupIcon(groupId: GroupId, image: DataURL): Promise<boolean> {
      return evaluate(
        ({ groupId, image }) => WAPI.setGroupIcon(groupId, image),
        { groupId, image }
      );
    },
    
    async getGroupInfo(groupId: GroupId): Promise<GroupMetadata | null> {
      return unsupportedGetGroupInfo(groupId);
    },
    
    async getGroupMembers(groupId: GroupId): Promise<ContactId[]> {
      return evaluate(
        ({ groupId }) => WAPI.getGroupParticipantIDs(groupId),
        { groupId }
      ) as Promise<ContactId[]>;
    },
    
    async getGroupInviteLink(groupId: GroupId): Promise<string> {
      return evaluate(
        ({ groupId }) => WAPI.getGroupInviteLink(groupId),
        { groupId }
      );
    },
    
    async revokeGroupInviteLink(groupId: GroupId): Promise<string | boolean> {
      return evaluate(
        ({ groupId }) => WAPI.revokeGroupInviteLink(groupId),
        { groupId }
      );
    },
    
    async joinGroupViaLink(inviteLink: string): Promise<GroupId | boolean> {
      return evaluate(
        ({ inviteLink }) => WAPI.joinGroupViaLink(inviteLink, false),
        { inviteLink }
      ) as Promise<GroupId | boolean>;
    },
    
    async leaveGroup(groupId: GroupId): Promise<boolean> {
      const result = await evaluate(
        ({ groupId }) => WAPI.leaveGroup(groupId),
        { groupId }
      );
      return !!result;
    },
  };
}
