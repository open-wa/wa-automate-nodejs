# V5 Schema Method Naming Audit & Proposal

> Generated from `packages/schema/src/methods/*.ts`
> Date: 2026-04-06

## Summary

There are **96 methods** across 10 files. The naming is inconsistent in several ways:

1. **Verb patterns** — mix of `get*`, `getAll*`, `send*`, `set*`, `contact*` (noun-first), `add*`, `remove*`, `star*`/`unstar*`, `post*`
2. **Namespace leaks** — methods defined in `utilities.ts` belonging to `namespace: 'messages'`, message-related methods in `media.ts`
3. **Parameter naming** — same concept has different param names (`id`, `contactId`, `chatId`, `to`, `groupId`, `communityId`, `groupChatId`)
4. **Pluralization** — `getAllChats` vs `getChat` vs `getChatById` (redundant pair)
5. **Legacy WAPI leakage** — names like `contactBlock`, `getProfilePicFromServer`, `getBusinessProfilesProducts`, `sendPtt`, `getGptArray`

---

## Current → Proposed Rename Map

Convention:
- **`{verb}.{noun}`** pattern — `list`, `get`, `create`, `update`, `delete`, `send`
- **Singular nouns** for single-entity, **plural** for collections
- **Consistent param names**: `chatId`, `contactId`, `groupId`, `communityId`, `messageId`
- No `getAll*` — use `list*` for collections
- No `From*` suffixes — function name should be self-descriptive

---

### `messaging.ts` — Namespace: `messages`

| # | Current Name | Proposed Name | Notes |
|---|---|---|---|
| 1 | `sendText` | `sendText` | ✅ Good |
| 2 | `sendTextWithMentions` | `sendTextWithMentions` | ✅ Good |
| 3 | `sendReplyWithMentions` | `sendReplyWithMentions` | ✅ Good |
| 4 | `sendPaymentRequest` | `sendPaymentRequest` | ✅ Good |
| 5 | `sendImage` | `sendImage` | ✅ Good |
| 6 | `sendFile` | `sendFile` | ✅ Good |
| 7 | `sendAudio` | `sendAudio` | ✅ Good |
| 8 | `sendPtt` | **`sendVoiceNote`** | 🔴 "PTT" is internal WA jargon (push-to-talk) |
| 9 | `sendVideoAsGif` | `sendVideoAsGif` | ✅ Good |
| 10 | `sendLocation` | `sendLocation` | ✅ Good |
| 11 | `sendVCard` | `sendVCard` | ✅ Good |
| 12 | `sendContact` | `sendContact` | ✅ Good |
| 13 | `sendMultipleContacts` | **`sendContacts`** | 🟡 Simplify — plural is sufficient |
| 14 | `sendButtons` | `sendButtons` | ✅ (deprecated) |
| 15 | `sendAdvancedButtons` | `sendAdvancedButtons` | ✅ (deprecated) |
| 16 | `sendListMessage` | **`sendList`** | 🟡 Redundant "Message" suffix |
| 17 | `sendPoll` | `sendPoll` | ✅ Good |
| 18 | `sendBanner` | `sendBanner` | ✅ Good |
| 19 | `sendYoutubeLink` | **`sendLinkPreview`** | 🟡 YouTube-specific name for a generic link preview function |
| 20 | `sendLinkWithAutoPreview` | **`sendLink`** | 🟡 Redundant suffix |
| 21 | `sendMessageWithThumb` | **`sendLinkWithThumbnail`** | 🟡 Vague "message with thumb" — it sends a link preview |
| 22 | `forwardMessages` | `forwardMessages` | ✅ Good |
| 23 | `deleteMessage` | `deleteMessage` | ✅ Good |
| 24 | `getMessageById` | **`getMessage`** | 🟡 `ById` is redundant — all singular gets are by ID |
| 25 | `getAllMessages` | **`listMessages`** | 🟡 Use `list` convention for collections |

---

### `chats.ts` — Namespace: `chats`

| # | Current Name | Proposed Name | Notes |
|---|---|---|---|
| 26 | `getAllChats` | **`listChats`** | 🟡 `list` convention |
| 27 | `getAllChatIds` | **`listChatIds`** | 🟡 `list` convention |
| 28 | `getAllChatsWithMessages` | **`listChatsWithMessages`** | 🟡 `list` convention |
| 29 | `getChatById` | **`getChat`** | 🔴 Redundant — same concept as `getChat` below. Remove one. |
| 30 | `getChat` | **`getChat`** | ✅ Keep this one |
| 31 | `getChatWithNonContacts` | **`listNonContactChats`** | 🟡 Clearer phrasing |
| 32 | `archiveChat` | `archiveChat` | ✅ Good |
| 33 | `unarchiveChat` | `unarchiveChat` | ✅ Good |
| 34 | `clearChat` | `clearChat` | ✅ Good |
| 35 | `deleteChat` | `deleteChat` | ✅ Good |
| 36 | `pinChat` | `pinChat` | ✅ Good |
| 37 | `unpinChat` | `unpinChat` | ✅ Good |
| 38 | `muteChat` | `muteChat` | ✅ Good |
| 39 | `unmuteChat` | `unmuteChat` | ✅ Good |
| 40 | `markAsRead` | `markAsRead` | ✅ Good |
| 41 | `markAsUnread` | `markAsUnread` | ✅ Good |
| 42 | `setChatEphemeral` | **`setEphemeralTimer`** | 🟡 More descriptive |
| 43 | `isChatOnline` | **`getChatPresence`** | 🟡 Verb pattern — returns presence, not just boolean |

---

### `contacts.ts` — Namespace: `contacts`

| # | Current Name | Proposed Name | Notes |
|---|---|---|---|
| 44 | `getAllContacts` | **`listContacts`** | 🟡 `list` convention |
| 45 | `getContact` | `getContact` | ✅ Good |
| 46 | `getCommonGroups` | `getCommonGroups` | ✅ Good |
| 47 | `getNumberProfile` | **`getNumberInfo`** | 🟡 "Profile" is overloaded (pfp, status, etc.) |
| 48 | `getBlockedIds` | **`listBlockedContacts`** | 🔴 Inconsistent — returns IDs but name doesn't say IDs, and `list*` convention |
| 49 | `contactBlock` | **`blockContact`** | 🔴 Noun-first pattern is Java-style, not JS |
| 50 | `contactUnblock` | **`unblockContact`** | 🔴 Same issue |
| 51 | `checkReadReceipts` | **`getReadReceipts`** | 🟡 `check` is vague — this reads a setting |
| 52 | `checkNumberStatus` | **`isRegistered`** | 🟡 Clearer — checks if number is on WhatsApp |
| 53 | `getProfilePicFromServer` | **`getProfilePicture`** | 🔴 `FromServer` is an implementation detail |

---

### `groups.ts` — Namespace: `groups`

| # | Current Name | Proposed Name | Notes |
|---|---|---|---|
| 54 | `getGroupMembers` | **`listGroupMembers`** | 🟡 `list` convention |
| 55 | `getAllGroups` | **`listGroups`** | 🟡 `list` convention |
| 56 | `getGroupMembersId` | **`listGroupMemberIds`** | 🔴 `Id` not pluralized, `list` convention |
| 57 | `getGroupInfo` | `getGroupInfo` | ✅ Good |
| 58 | `getGroupAdmins` | **`listGroupAdmins`** | 🟡 `list` convention |
| 59 | `getKickedGroups` | **`listKickedGroups`** | 🟡 `list` convention |
| 60 | `getGroupInviteLink` | `getGroupInviteLink` | ✅ Good |
| 61 | `createGroup` | `createGroup` | ✅ Good |
| 62 | `leaveGroup` | `leaveGroup` | ✅ Good |
| 63 | `joinGroupViaLink` | **`joinGroup`** | 🟡 "ViaLink" is implementation — only way to join |
| 64 | `revokeGroupInviteLink` | `revokeGroupInviteLink` | ✅ Good |
| 65 | `setGroupTitle` | `setGroupTitle` | ✅ Good |
| 66 | `setGroupDescription` | `setGroupDescription` | ✅ Good |
| 67 | `setGroupIcon` | `setGroupIcon` | ✅ Good |
| 68 | `setGroupToAdminsOnly` | **`setGroupMessagesRestriction`** | 🟡 More precise |
| 69 | `setGroupEditToAdminsOnly` | **`setGroupEditRestriction`** | 🟡 More precise |
| 70 | `addParticipant` | **`addGroupParticipant`** | 🟡 Missing `Group` qualifier — ambiguous |
| 71 | `removeParticipant` | **`removeGroupParticipant`** | 🟡 Same |
| 72 | `promoteParticipant` | **`promoteGroupParticipant`** | 🟡 Same |
| 73 | `demoteParticipant` | **`demoteGroupParticipant`** | 🟡 Same |
| 74 | `approveGroupJoinRequest` | `approveGroupJoinRequest` | ✅ Good |
| 75 | `rejectGroupJoinRequest` | `rejectGroupJoinRequest` | ✅ Good |

---

### `communities.ts` — Namespace: `communities`

| # | Current Name | Proposed Name | Notes |
|---|---|---|---|
| 76 | `getAllCommunities` | **`listCommunities`** | 🟡 `list` convention |
| 77 | `getCommunityInfo` | `getCommunityInfo` | ✅ Good |
| 78 | `getCommunityParticipantIds` | **`listCommunityMemberIds`** | 🟡 `list`, and "participant" vs "member" — groups uses "member" |
| 79 | `getCommunityAdminIds` | **`listCommunityAdminIds`** | 🟡 `list` |
| 80 | `getCommunityParticipants` | **`listCommunityMembers`** | 🟡 Same member/participant consistency |
| 81 | `getCommunityAdmins` | **`listCommunityAdmins`** | 🟡 `list` |

---

### `status.ts` — Namespace: `status`

| # | Current Name | Proposed Name | Notes |
|---|---|---|---|
| 82 | `postTextStatus` | `postTextStatus` | ✅ Good |
| 83 | `postImageStatus` | `postImageStatus` | ✅ Good |
| 84 | `postVideoStatus` | `postVideoStatus` | ✅ Good |
| 85 | `getStories` | **`listStatuses`** | 🔴 "Stories" is Instagram term, WA uses "Status" |
| 86 | `getStatus` | `getStatus` | ✅ Good |
| 87 | `deleteStatus` | `deleteStatus` | ✅ Good |
| 88 | `deleteAllStatus` | **`deleteAllStatuses`** | 🟡 Pluralize |

---

### `labels.ts` — Namespace: `labels`

| # | Current Name | Proposed Name | Notes |
|---|---|---|---|
| 89 | `getAllLabels` | **`listLabels`** | 🟡 `list` |
| 90 | `getChatsByLabel` | **`listChatsByLabel`** | 🟡 `list` |
| 91 | `addLabel` | `addLabel` | ✅ Good |
| 92 | `removeLabel` | `removeLabel` | ✅ Good |

---

### `business.ts` — Namespace: `business`

| # | Current Name | Proposed Name | Notes |
|---|---|---|---|
| 93 | `getBusinessProfile` | `getBusinessProfile` | ✅ Good |
| 94 | `getBusinessProfilesProducts` | **`listBusinessProducts`** | 🔴 "Profiles" is wrong — it's one profile's products |
| 95 | `getOrder` | `getOrder` | ✅ Good |

---

### `utilities.ts` — Namespace: `utilities` (mostly)

> ⚠️ This file is a grab bag. Many methods here belong in other namespaces.

| # | Current Name | Proposed Name | Namespace | Notes |
|---|---|---|---|---|
| 96 | `getMe` | `getMe` | `session` | ✅ Good name, wrong namespace |
| 97 | `getHostNumber` | `getHostNumber` | `session` | ✅ Good, move namespace |
| 98 | `getConnectionState` | `getConnectionState` | `session` | ✅ Good, move namespace |
| 99 | `getWAVersion` | **`getWhatsAppVersion`** | `session` | 🟡 Spell it out |
| 100 | `getBatteryLevel` | `getBatteryLevel` | `session` | ✅ Good (even though deprecated in WAPI) |
| 101 | `getIsPlugged` | **`isPlugged`** | `session` | 🟡 `getIs*` is awkward |
| 102 | `getFeatures` | `getFeatures` | `session` | ✅ Good |
| 103 | `getLicenseType` | `getLicenseType` | `session` | ✅ Good |
| 104 | `getGeneratedUserAgent` | **`getUserAgent`** | `session` | 🟡 "Generated" is implementation detail |
| 105 | `getProcessStats` | `getProcessStats` | `diagnostics` | ✅ Good |
| 106 | `getAmountOfLoadedMessages` | **`getLoadedMessageCount`** | `diagnostics` | 🟡 Verbose |
| 107 | `getSnapshot` | **`takeScreenshot`** | `diagnostics` | 🟡 "Snapshot" is ambiguous |
| 108 | `healthCheck` | `healthCheck` | `diagnostics` | ✅ Good |
| 109 | `setMyName` | **`setDisplayName`** | `profile` | 🟡 "My" is implicit |
| 110 | `setMyStatus` | **`setStatusText`** | `profile` | 🟡 Clarify it's the text status |
| 111 | `setProfilePic` | **`setProfilePicture`** | `profile` | 🟡 Full word |
| 112 | `getMyLastMessage` | **`getLastSentMessage`** | `messages` | 🔴 Wrong file & namespace leak |
| 113 | `getStarredMessages` | **`listStarredMessages`** | `messages` | 🔴 Wrong file & namespace |
| 114 | `getUnsentMessages` | **`listUnsentMessages`** | `messages` | 🔴 Wrong file & namespace |
| 115 | `getMessageInfo` | `getMessageInfo` | `messages` | 🔴 Wrong file |
| 116 | `getVCards` | **`extractVCards`** | `messages` | 🔴 Wrong file, and it extracts from a message |
| 117 | `getGptArray` | **`getMessagesForLLM`** | `messages` | 🔴 "GPT" is too vendor-specific |
| 118 | `starMessage` | `starMessage` | `messages` | 🔴 Wrong file |
| 119 | `unstarMessage` | `unstarMessage` | `messages` | 🔴 Wrong file |
| 120 | `react` | **`reactToMessage`** | `messages` | 🔴 Too generic a name + wrong file |
| 121 | `sendSeen` | **`markAsSeen`** | `messages` | 🔴 Wrong file, and `send*` implies sending something |

---

### `media.ts` — Namespace: `media` / `messages`

| # | Current Name | Proposed Name | Namespace | Notes |
|---|---|---|---|---|
| 122 | `decryptMedia` | `decryptMedia` | `media` | ✅ Good |
| 123 | `downloadMedia` | `downloadMedia` | `media` | ✅ Good |
| 124 | `sendFileFromUrl` | **`sendFileFromUrl`** | `messages` | 🟡 Namespace should be messages |
| 125 | `loadEarlierMessages` | **`loadOlderMessages`** | `messages` | 🟡 Wrong file, "earlier" is unusual phrasing |

---

## Inconsistency Summary

### 🔴 Critical (semantically wrong or confusingly named)

| Issue | Offenders |
|---|---|
| Noun-first verbs | `contactBlock`, `contactUnblock` |
| Implementation details in name | `getProfilePicFromServer`, `getGeneratedUserAgent` |
| Wrong file placement | 14 methods in `utilities.ts` belong in `messages`, `loadEarlierMessages` in `media.ts` |
| Vendor-specific naming | `getGptArray`, `sendPtt` |
| Duplicate concept | `getChat` + `getChatById` do the same thing |
| Wrong pluralization | `getBusinessProfilesProducts` (profiles → profile's) |

### 🟡 Cosmetic (convention alignment)

| Issue | Count | Pattern |
|---|---|---|
| `getAll*` → `list*` | ~15 | Collection listing should use `list` |
| `ById` suffix | 2 | Redundant — singular gets are always by ID |
| Parameter name inconsistencies | many | `id` vs `contactId` vs `chatId` for the same concept |

---

## Proposed Parameter Standardization

| Concept | Current variants | Proposed standard |
|---|---|---|
| Target chat | `to`, `chatId`, `id`, `contactId` (in chats) | **`chatId`** for reads, **`to`** for sends |
| Contact | `id`, `contactId` | **`contactId`** |
| Group | `groupId`, `chatId`, `groupChatId` | **`groupId`** |
| Community | `communityId` | **`communityId`** ✅ |
| Message ref | `messageId`, `msgId`, `id`, `replyMessageId` | **`messageId`** |
| Multiple messages | `messageId` (but accepts array), `messages` | **`messageIds`** for arrays |

---

## Proposed Namespace Reorganization

```
session/     → getMe, getHostNumber, getConnectionState, getWhatsAppVersion, 
               getBatteryLevel, isPlugged, getFeatures, getLicenseType, getUserAgent

diagnostics/ → getProcessStats, getLoadedMessageCount, takeScreenshot, healthCheck

profile/     → setDisplayName, setStatusText, setProfilePicture

messages/    → sendText, sendImage, sendFile, sendAudio, sendVoiceNote, sendVideoAsGif,
               sendLocation, sendVCard, sendContact, sendContacts, sendButtons (deprecated),
               sendAdvancedButtons (deprecated), sendList (deprecated), sendPoll, sendBanner,
               sendLinkPreview, sendLink, sendLinkWithThumbnail, forwardMessages,
               deleteMessage, getMessage, listMessages, getLastSentMessage,
               listStarredMessages, listUnsentMessages, getMessageInfo, extractVCards,
               getMessagesForLLM, starMessage, unstarMessage, reactToMessage, markAsSeen,
               loadOlderMessages, sendPaymentRequest, sendReplyWithMentions, sendTextWithMentions

chats/       → listChats, listChatIds, listChatsWithMessages, getChat, listNonContactChats,
               archiveChat, unarchiveChat, clearChat, deleteChat, pinChat, unpinChat,
               muteChat, unmuteChat, markAsRead, markAsUnread, setEphemeralTimer, getChatPresence

contacts/    → listContacts, getContact, getCommonGroups, getNumberInfo, listBlockedContacts,
               blockContact, unblockContact, getReadReceipts, isRegistered, getProfilePicture

groups/      → listGroups, getGroupInfo, listGroupMembers, listGroupMemberIds, listGroupAdmins,
               listKickedGroups, getGroupInviteLink, createGroup, leaveGroup, joinGroup,
               revokeGroupInviteLink, setGroupTitle, setGroupDescription, setGroupIcon,
               setGroupMessagesRestriction, setGroupEditRestriction,
               addGroupParticipant, removeGroupParticipant, promoteGroupParticipant,
               demoteGroupParticipant, approveGroupJoinRequest, rejectGroupJoinRequest

communities/ → listCommunities, getCommunityInfo, listCommunityMembers, listCommunityMemberIds,
               listCommunityAdmins, listCommunityAdminIds

status/      → postTextStatus, postImageStatus, postVideoStatus, listStatuses, getStatus,
               deleteStatus, deleteAllStatuses

labels/      → listLabels, listChatsByLabel, addLabel, removeLabel

business/    → getBusinessProfile, listBusinessProducts, getOrder

media/       → decryptMedia, downloadMedia
```

---

## Migration Notes

- The `runtimeSurface.ts` mapping layer means renames don't need to touch WAPI.js — the surface already maps `getAllMessages` → `getAllMessagesInChat` etc.
- The `invokeClientMethod` dispatcher looks up `client[def.functionName]`, so renames only need updates in: schema definition, `runtimeSurface.ts`, `ClientFacade` declarations, and method module exports.
- The socket-client's `ask()` uses method names as-is — so downstream consumers (dashboard, plugins, SDK users) would need migration.
- **Recommendation**: implement as aliases first (register both old and new names), deprecate old names, remove in v6.
