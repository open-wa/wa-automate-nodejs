---
id: "api_model_group_metadata.GroupMetadata"
title: "Interface: GroupMetadata"
sidebar_label: "GroupMetadata"
custom_edit_url: null
---

[api/model/group-metadata](/api/modules/api_model_group_metadata.md).GroupMetadata

## Properties

### creation

• **creation**: `number`

The timestamp of when the group was created

___

### defaultSubgroup

• **defaultSubgroup**: `boolean`

Communities have a default group chat

___

### desc

• `Optional` **desc**: `string`

The description of the group

___

### descOwner

• `Optional` **descOwner**: [`ContactId`](/api/types/api_model_aliases.ContactId.md)

The account that set the description last.

___

### groupType

• **groupType**: ``"DEAFULT"`` \| ``"SUBGROUP"`` \| ``"COMMUNITY"``

The type of group

___

### id

• **id**: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md)

The chat id of the group GroupChatId

___

### isParentGroup

• `Optional` **isParentGroup**: `boolean`

Is this group a parent group (a.k.a community)

___

### isParentGroupClosed

• **isParentGroupClosed**: `boolean`

___

### joinedSubgroups

• **joinedSubgroups**: \`${number}@g.us\`[]

List of Group IDs that the host account has joined as part of this community

___

### owner

• **owner**: [`NonSerializedId`](/api/types/api_model_aliases.NonSerializedId.md)

The id of the owner of the group ContactId

___

### participants

• **participants**: [`Participant`](/api/interfaces/api_model_group_metadata.Participant.md)[]

An array of participants in the group

___

### pendingParticipants

• **pendingParticipants**: [`Participant`](/api/interfaces/api_model_group_metadata.Participant.md)[]

Unknown.

___

### support

• `Optional` **support**: `boolean`

Not sure what this represents

___

### suspended

• `Optional` **suspended**: `boolean`

Not sure what this represents

___

### trusted

• `Optional` **trusted**: `boolean`
