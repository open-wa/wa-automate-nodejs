---
title: Interface - GroupMetadata
---

# Interface: GroupMetadata

## Properties

### creation

> **creation**: `number`

The timestamp of when the group was created

***

### defaultSubgroup

> **defaultSubgroup**: `boolean`

Communities have a default group chat

***

### desc?

> `optional` **desc**: `string`

The description of the group

***

### descOwner?

> `optional` **descOwner**: [`ContactId`](/docs/reference/api/model/aliases/type-aliases/ContactId)

The account that set the description last.

***

### groupType

> **groupType**: `"DEAFULT"` \| `"SUBGROUP"` \| `"COMMUNITY"`

The type of group

***

### id

> **id**: [`GroupChatId`](/docs/reference/api/model/aliases/type-aliases/GroupChatId)

The chat id of the group `GroupChatId`

***

### isParentGroup?

> `optional` **isParentGroup**: `boolean`

Is this group a parent group (a.k.a community)

***

### isParentGroupClosed

> **isParentGroupClosed**: `boolean`

***

### joinedSubgroups

> **joinedSubgroups**: \`$\{number\}@g.us\`[]

List of Group IDs that the host account has joined as part of this community

***

### owner

> **owner**: [`NonSerializedId`](/docs/reference/api/model/aliases/type-aliases/NonSerializedId)

The id of the owner of the group `ContactId`

***

### participants

> **participants**: [`Participant`](/docs/reference/api/model/group-metadata/interfaces/Participant)[]

An array of participants in the group

***

### pendingParticipants

> **pendingParticipants**: [`Participant`](/docs/reference/api/model/group-metadata/interfaces/Participant)[]

Unknown.

***

### support?

> `optional` **support**: `boolean`

Not sure what this represents

***

### suspended?

> `optional` **suspended**: `boolean`

Not sure what this represents

***

### trusted?

> `optional` **trusted**: `boolean`
