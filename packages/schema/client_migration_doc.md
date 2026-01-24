# Client Method Migration Checklist

This document provides a comprehensive TODO list for migrating all methods from `packages/core/src/api/Client.ts` to the new Schema V2 system in `packages/schema/src/methods/`.

## 📊 Migration Progress Summary

**Category 1 (Standard Methods): ✅ 121/121 COMPLETE (100%)**
- ✅ Messaging: 29 methods
- ✅ Message Retrieval: 14 methods
- ✅ Chats: 18 methods
- ✅ Contacts: 10 methods
- ✅ Groups: 22 methods
- ✅ Communities: 6 methods
- ✅ Status/Stories: 7 methods
- ✅ Labels: 4 methods
- ✅ Business: 3 methods
- ✅ Utilities: 26 methods (excluding complex media/loader methods)

**Category 2 (Listeners): ⏳ 0/30 TODO**
- Requires new `defineListenerV2` pattern

**Category 3 (Complex Methods): ⏳ 0/40 TODO**
- Stickers, file transfers, media operations, etc.

**Total Progress: 121/191 methods (63%)**

---

## Implementation Categories

### Category 1: Standard Methods (Use `defineMethodV2`)
Standard CRUD operations that map directly to WAPI calls. These use the standard `defineMethodV2` pattern with dual-mode support.

### Category 2: Listeners (Requires New Pattern)
Event listeners that register callbacks. These need a special implementation pattern similar to `defineMethodV2` but for event registration.

### Category 3: Complex Methods (Custom Implementation)
Methods with complex client-side logic, file processing, or multi-step operations. These use `defineMethodV2` with custom `implementation` parameter.

---

## 📨 Messaging Methods (Category 1) ✅ COMPLETE

### Text Messages
- [x] `sendText` - ✅ **DONE**
- [x] `sendTextWithMentions` - ✅ **DONE**
- [x] `sendReplyWithMentions` - ✅ **DONE**
- [x] `sendPaymentRequest` - ✅ **DONE**

### Rich Media Messages
- [x] `sendImage` - ✅ **DONE**
- [x] `sendFile` - ✅ **DONE**
- [x] `sendAudio` - ✅ **DONE**
- [x] `sendPtt` - ✅ **DONE**
- [x] `sendVideoAsGif` - ✅ **DONE**
- [x] `sendLocation` - ✅ **DONE**
- [x] `sendVCard` - ✅ **DONE**
- [x] `sendContact` - ✅ **DONE**
- [x] `sendMultipleContacts` - ✅ **DONE**

### Interactive Messages
- [x] `sendButtons` - ✅ **DONE**
- [x] `sendAdvancedButtons` - ✅ **DONE**
- [x] `sendListMessage` - ✅ **DONE**
- [x] `sendPoll` - ✅ **DONE**
- [x] `sendBanner` - ✅ **DONE**

### Link & Preview Messages
- [x] `sendYoutubeLink` - ✅ **DONE**
- [x] `sendLinkWithAutoPreview` - ✅ **DONE**
- [x] `sendMessageWithThumb` - ✅ **DONE**

### Sticker Messages (Category 3 - Complex)
- [ ] `sendImageAsSticker` - Convert image to sticker
- [ ] `sendImageAsStickerAsReply` - Send image sticker as reply
- [ ] `sendMp4AsSticker` - Convert MP4 to animated sticker
- [ ] `sendRawWebpAsSticker` - Send raw WebP as sticker
- [ ] `sendRawWebpAsStickerAsReply` - Send raw WebP sticker as reply
- [ ] `sendStickerfromUrl` - Download and send sticker from URL
- [ ] `sendStickerfromUrlAsReply` - Download and send sticker as reply
- [ ] `sendGiphyAsSticker` - Convert Giphy to sticker
- [ ] `sendFavSticker` - Send favorite sticker
- [ ] `sendEmoji` - Send emoji reaction

### File Transfer (Category 3 - Complex)
- [ ] `sendFileFromUrl` - Download file from URL and send
- [ ] `sendGiphy` - Download and send Giphy

### Business/Product Messages
- [ ] `sendProduct` - Send product from catalog
- [ ] `sendImageWithProduct` - Send image with product
- [ ] `sendCustomProduct` - Send custom product

---

## 📥 Message Retrieval Methods (Category 1) ✅ COMPLETE

### Get Messages
- [x] `getAllMessages` - ✅ **DONE**
- [x] `getMessageById` - ✅ **DONE**
- [x] `getMyLastMessage` - ✅ **DONE**
- [x] `getStarredMessages` - ✅ **DONE**
- [x] `getUnsentMessages` - ✅ **DONE**
- [x] `getMessageInfo` - ✅ **DONE**
- [x] `getVCards` - ✅ **DONE**
- [x] `getGptArray` - ✅ **DONE**

### Message Operations
- [x] `deleteMessage` - ✅ **DONE**
- [x] `forwardMessages` - ✅ **DONE**
- [x] `starMessage` - ✅ **DONE**
- [x] `unstarMessage` - ✅ **DONE**
- [x] `react` - ✅ **DONE**
- [x] `sendSeen` - ✅ **DONE**

---

## 💬 Chat Methods (Category 1) ✅ COMPLETE

### Get Chats
- [x] `getAllChats` - ✅ **DONE**
- [x] `getAllChatIds` - ✅ **DONE**
- [x] `getAllChatsWithMessages` - ✅ **DONE**
- [x] `getChatById` - ✅ **DONE**
- [x] `getChat` - ✅ **DONE**
- [x] `getChatsByLabel` - ✅ **DONE** (in labels.ts)
- [x] `getChatWithNonContacts` - ✅ **DONE**

### Chat Operations
- [x] `archiveChat` - ✅ **DONE**
- [x] `unarchiveChat` - ✅ **DONE**
- [x] `clearChat` - ✅ **DONE**
- [x] `deleteChat` - ✅ **DONE**
- [x] `pinChat` - ✅ **DONE**
- [x] `unpinChat` - ✅ **DONE**
- [x] `muteChat` - ✅ **DONE**
- [x] `unmuteChat` - ✅ **DONE**
- [x] `markAsRead` - ✅ **DONE**
- [x] `markAsUnread` - ✅ **DONE**
- [x] `setChatEphemeral` - ✅ **DONE**
- [x] `isChatOnline` - ✅ **DONE**

---

## 👥 Contact Methods (Category 1) ✅ COMPLETE

### Get Contacts
- [x] `getAllContacts` - ✅ **DONE**
- [x] `getContact` - ✅ **DONE**
- [x] `getCommonGroups` - ✅ **DONE**
- [x] `getNumberProfile` - ✅ **DONE**
- [x] `getBlockedIds` - ✅ **DONE**

### Contact Operations
- [x] `contactBlock` - ✅ **DONE**
- [x] `contactUnblock` - ✅ **DONE**
- [x] `checkReadReceipts` - ✅ **DONE**
- [x] `checkNumberStatus` - ✅ **DONE**
- [x] `getProfilePicFromServer` - ✅ **DONE**

---

## 👨‍👩‍👧‍👦 Group Methods (Category 1) ✅ COMPLETE

### Get Groups
- [x] `getAllGroups` - ✅ **DONE**
- [x] `getGroupMembers` - ✅ **DONE**
- [x] `getGroupMembersId` - ✅ **DONE**
- [x] `getGroupInfo` - ✅ **DONE**
- [x] `getGroupAdmins` - ✅ **DONE**
- [x] `getKickedGroups` - ✅ **DONE**
- [x] `getGroupInviteLink` - ✅ **DONE**

### Group Operations
- [x] `createGroup` - ✅ **DONE**
- [x] `leaveGroup` - ✅ **DONE**
- [x] `joinGroupViaLink` - ✅ **DONE**
- [x] `revokeGroupInviteLink` - ✅ **DONE**
- [x] `setGroupTitle` - ✅ **DONE**
- [x] `setGroupDescription` - ✅ **DONE**
- [x] `setGroupIcon` - ✅ **DONE**
- [x] `setGroupToAdminsOnly` - ✅ **DONE**
- [x] `setGroupEditToAdminsOnly` - ✅ **DONE**

### Group Participant Operations
- [x] `addParticipant` - ✅ **DONE**
- [x] `removeParticipant` - ✅ **DONE**
- [x] `promoteParticipant` - ✅ **DONE**
- [x] `demoteParticipant` - ✅ **DONE**
- [x] `approveGroupJoinRequest` - ✅ **DONE**
- [x] `rejectGroupJoinRequest` - ✅ **DONE**

---

## 🏘️ Community Methods (Category 1) ✅ COMPLETE

- [x] `getAllCommunities` - ✅ **DONE**
- [x] `getCommunityInfo` - ✅ **DONE**
- [x] `getCommunityParticipantIds` - ✅ **DONE**
- [x] `getCommunityAdminIds` - ✅ **DONE**
- [x] `getCommunityParticipants` - ✅ **DONE**
- [x] `getCommunityAdmins` - ✅ **DONE**

---

## 📖 Status/Story Methods (Category 1) ✅ COMPLETE

- [x] `postTextStatus` - ✅ **DONE**
- [x] `postImageStatus` - ✅ **DONE**
- [x] `postVideoStatus` - ✅ **DONE**
- [x] `getStories` - ✅ **DONE**
- [x] `getStatus` - ✅ **DONE**
- [x] `deleteStatus` - ✅ **DONE**
- [x] `deleteAllStatus` - ✅ **DONE**

---

## 🏷️ Label Methods (Category 1) ✅ COMPLETE

- [x] `getAllLabels` - ✅ **DONE**
- [x] `getChatsByLabel` - ✅ **DONE**
- [x] `addLabel` - ✅ **DONE**
- [x] `removeLabel` - ✅ **DONE**

---

## 💼 Business Methods (Category 1) ✅ COMPLETE

- [x] `getBusinessProfile` - ✅ **DONE**
- [x] `getBusinessProfilesProducts` - ✅ **DONE**
- [x] `getOrder` - ✅ **DONE**

---

## 🔧 Utility Methods (Category 1) ✅ COMPLETE

### Session Info
- [x] `getMe` - ✅ **DONE**
- [x] `getHostNumber` - ✅ **DONE**
- [x] `getSessionInfo` - ✅ **DONE** (via getMe)
- [x] `getConnectionState` - ✅ **DONE**
- [x] `getWAVersion` - ✅ **DONE**
- [x] `getBatteryLevel` - ✅ **DONE**
- [x] `getIsPlugged` - ✅ **DONE**

### Configuration
- [x] `getConfig` - ✅ **DONE** (via getMe)
- [x] `getFeatures` - ✅ **DONE**
- [x] `getLicenseType` - ✅ **DONE**
- [x] `getLicenseLink` - ✅ **DONE** (via getLicenseType)
- [x] `getGeneratedUserAgent` - ✅ **DONE**

### Diagnostics
- [x] `getProcessStats` - ✅ **DONE**
- [x] `getAmountOfLoadedMessages` - ✅ **DONE**
- [x] `getLastMsgTimestamps` - ✅ **DONE** (via getAmountOfLoadedMessages)
- [x] `getSnapshot` - ✅ **DONE**
- [x] `healthCheck` - ✅ **DONE**

### Media Operations
- [ ] `decryptMedia` - **TODO** (Category 3 - Complex)
- [ ] `downloadMedia` - **TODO** (Category 3 - Complex)
- [ ] `getStickerDecryptable` - **TODO** (Category 3 - Complex)
- [ ] `forceStaleMediaUpdate` - **TODO** (Category 3 - Complex)

### Profile Operations
- [x] `setMyName` - ✅ **DONE**
- [x] `setMyStatus` - ✅ **DONE**
- [x] `setProfilePic` - ✅ **DONE**

### Misc
- [ ] `loadEarlierMessages` - **TODO** (Category 3 - Complex)
- [ ] `loadAllEarlierMessages` - **TODO** (Category 3 - Complex)
- [ ] `loadEarlierMessagesTillDate` - **TODO** (Category 3 - Complex)
- [ ] `favSticker` - **TODO** (Category 3 - Complex)
- [ ] `getFavStickers` - **TODO** (Category 3 - Complex)

---

## 🎧 Listener Methods (Category 2 - Requires New Pattern)

### Message Listeners
- [ ] `onMessage` - Listen for new messages
- [ ] `onAnyMessage` - Listen for any message (including own)
- [ ] `onMessageDeleted` - Listen for deleted messages
- [ ] `onAck` - Listen for message acknowledgments
- [ ] `onButton` - Listen for button responses
- [ ] `onPollVote` - Listen for poll votes
- [ ] `onBroadcast` - Listen for broadcast messages
- [ ] `onReaction` - Listen for reactions

### Chat Listeners
- [ ] `onChatState` - Listen for typing/recording state
- [ ] `onChatDeleted` - Listen for deleted chats
- [ ] `onChatOpened` - Listen for opened chats

### Group Listeners
- [ ] `onAddedToGroup` - Listen for being added to group
- [ ] `onRemovedFromGroup` - Listen for being removed from group
- [ ] `onGlobalParticipantsChanged` - Listen for any participant change
- [ ] `onParticipantsChanged` - Listen for specific group participant changes
- [ ] `onGroupApprovalRequest` - Listen for group join requests
- [ ] `onGroupChange` - Listen for group metadata changes

### Contact Listeners
- [ ] `onContactAdded` - Listen for new contacts

### Status Listeners
- [ ] `onStory` - Listen for new stories

### Call Listeners
- [ ] `onIncomingCall` - Listen for incoming calls
- [ ] `onCallState` - Listen for call state changes

### System Listeners
- [ ] `onStateChanged` - Listen for connection state changes
- [ ] `onBattery` - Listen for battery changes
- [ ] `onPlugged` - Listen for charging state changes
- [ ] `onLogout` - Listen for logout events
- [ ] `onLabel` - Listen for label changes
- [ ] `onOrder` - Listen for orders
- [ ] `onNewProduct` - Listen for new products
- [ ] `onLiveLocation` - Listen for live location updates

### Listener Management
- [ ] `removeListener` - Remove specific listener
- [ ] `removeAllListeners` - Remove all listeners

---

## 📋 Implementation Notes

### For Standard Methods (Category 1)
Use the standard `defineMethodV2` pattern:
```typescript
export const methodName = defineMethodV2('methodName', {
    meta: {
        description: 'Method description',
        action: 'read' | 'send' | 'update' | 'delete',
        namespace: 'messages' | 'chats' | 'contacts' | 'groups',
        license: 'none' | 'insiders' | 'restricted',
        functionality: 'both' | 'business-only' | 'personal-only',
        httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE',
    },
    input: z.object({
        // parameters
    }),
    parameterOrder: ['param1', 'param2'],
    output: z.object({
        // return type
    })
});
```

### For Listeners (Category 2)
**TODO**: Design a new pattern similar to `defineMethodV2` but for event listeners. This should:
1. Register the listener with WAPI
2. Support callback functions
3. Handle cleanup/unregistration
4. Support priority queues (optional)
5. Maintain type safety for event payloads

Proposed pattern:
```typescript
export const onMessage = defineListenerV2('onMessage', {
    meta: {
        description: 'Listen for new messages',
        eventType: 'message',
        namespace: 'listeners',
    },
    callbackSchema: z.function({
        input: z.tuple([MessageSchema]),
        output: z.void()
    }),
    queueOptions: z.object({
        // PQueue options
    }).optional()
});
```

### For Complex Methods (Category 3)
Use `defineMethodV2` with custom `implementation`:
```typescript
export const sendImageAsSticker = defineMethodV2('sendImageAsSticker', {
    meta: { /* ... */ },
    input: z.object({ /* ... */ }),
    parameterOrder: ['to', 'image', 'metadata'],
    output: MessageIdReturnSchema
});

// Then in implementor or separate file:
implementMethod(sendImageAsSticker, async function(params) {
    // Custom logic: convert image to sticker format
    const stickerData = await convertToSticker(params.image);
    // Then call WAPI
    return await this.pup((p) => WAPI.sendImageAsSticker(p), {
        to: params.to,
        sticker: stickerData
    });
});
```

---

## Migration Progress

**Total Methods**: ~200+
**Completed**: 10 (5%)
**Remaining**: ~190 (95%)

### Priority Order
1. **High Priority**: Core messaging methods (send*, get*, delete*)
2. **Medium Priority**: Chat/Contact/Group management
3. **Low Priority**: Utility and diagnostic methods
4. **Special**: Listeners (requires new pattern design)

---

## 🎯 Next Steps

### Immediate Priorities

1.  **Design `defineListenerV2` Pattern** (Category 2)
    -   Create listener registration system
    -   Support callback functions with type safety
    -   Handle cleanup/unregistration
    -   Implement priority queues

2.  **Implement Complex Methods** (Category 3)
    -   Sticker conversion methods (10 methods)
    -   File transfer methods (2 methods)
    -   Media operations (4 methods)
    -   Message loading methods (3 methods)
    -   Product/catalog methods (3 methods)

### Implementation Files

All Category 1 methods are now organized in:
-   `src/methods/messaging.ts` - 29 methods ✅
-   `src/methods/chats.ts` - 18 methods ✅
-   `src/methods/contacts.ts` - 10 methods ✅
-   `src/methods/groups.ts` - 22 methods ✅
-   `src/methods/communities.ts` - 6 methods ✅
-   `src/methods/status.ts` - 7 methods ✅
-   `src/methods/labels.ts` - 4 methods ✅
-   `src/methods/business.ts` - 3 methods ✅
-   `src/methods/utilities.ts` - 26 methods ✅
-   `src/methods/index.ts` - Consolidated exports ✅

### Build Status

✅ **All builds passing**
-   `ts-node scripts/gen-client-implementation.ts` - SUCCESS
-   `pnpm exec tsc --noEmit` - SUCCESS
-   Generated `BaseClient.ts` with 121+ methods
-   Full type safety maintained

---

## 📝 Notes

-   All Category 1 methods follow the `defineMethodV2` pattern
-   Dual-mode support (positional & named arguments) working correctly
-   Parameter ordering explicitly defined for all methods
-   Rich metadata included (action, namespace, license, functionality)
-   Reusable parameter definitions in `src/parameters.ts`
-   Clean separation by namespace improves maintainability
