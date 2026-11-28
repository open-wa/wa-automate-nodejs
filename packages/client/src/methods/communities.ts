import type { Client } from '../Client';
import {
  getAllCommunities,
  getCommunityInfo,
  getCommunityParticipantIds,
  getCommunityAdminIds,
  getCommunityParticipants,
  getCommunityAdmins,
  type GroupChatId,
  type CommunityMetadata,
  type CommunityParticipantIds,
  type CommunityAdminIds,
  type CommunityParticipants,
  type CommunityAdmins,
} from '@open-wa/schema';

type CommunityMethod =
  | 'listInsidersCommunities'
  | 'readInsidersCommunityInfo'
  | 'readInsidersCommunityParticipantIds'
  | 'readInsidersCommunityAdminIds'
  | 'readInsidersCommunityParticipants'
  | 'readInsidersCommunityAdmins';

declare const WAPI: Partial<Record<CommunityMethod, (communityId?: string) => Promise<unknown>>>;

async function readCommunity(client: Client, method: CommunityMethod, communityId?: string) {
  const result = await client.evaluate(async input => {
    const read = WAPI[input.method];
    if (typeof read !== 'function') return { licensed: false as const };
    return { licensed: true as const, value: await read(input.communityId) };
  }, { method, communityId });
  if (!result.licensed) {
    throw Object.assign(new Error('Community reads require an Insiders license or higher and a current license payload.'), {
      name: 'InsidersLicenseRequiredError',
    });
  }
  return result.value;
}

export interface CommunityMethods {
  getAllCommunities(): Promise<GroupChatId[]>;
  getCommunityInfo(communityId: string): Promise<CommunityMetadata>;
  getCommunityParticipantIds(communityId: string): Promise<CommunityParticipantIds[]>;
  getCommunityAdminIds(communityId: string): Promise<CommunityAdminIds[]>;
  getCommunityParticipants(communityId: string): Promise<CommunityParticipants[]>;
  getCommunityAdmins(communityId: string): Promise<CommunityAdmins[]>;
}

export function communityMethods(client: Client): CommunityMethods {
  return {
    async getAllCommunities() {
      return getAllCommunities.openWAOutput.parse(await readCommunity(client, 'listInsidersCommunities'));
    },
    async getCommunityInfo(communityId: string) {
      return getCommunityInfo.openWAOutput.parse(await readCommunity(client, 'readInsidersCommunityInfo', communityId));
    },
    async getCommunityParticipantIds(communityId: string) {
      return getCommunityParticipantIds.openWAOutput.parse(await readCommunity(client, 'readInsidersCommunityParticipantIds', communityId));
    },
    async getCommunityAdminIds(communityId: string) {
      return getCommunityAdminIds.openWAOutput.parse(await readCommunity(client, 'readInsidersCommunityAdminIds', communityId));
    },
    async getCommunityParticipants(communityId: string) {
      return getCommunityParticipants.openWAOutput.parse(await readCommunity(client, 'readInsidersCommunityParticipants', communityId));
    },
    async getCommunityAdmins(communityId: string) {
      return getCommunityAdmins.openWAOutput.parse(await readCommunity(client, 'readInsidersCommunityAdmins', communityId));
    },
  };
}
