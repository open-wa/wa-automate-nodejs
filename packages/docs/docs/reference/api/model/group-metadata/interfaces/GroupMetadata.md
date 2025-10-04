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

> `optional` **descOwner**: [`ContactId`](/reference/api/model/aliases/type-aliases/ContactId.md)

The account that set the description last.

***

### groupType

> **groupType**: `"DEAFULT"` \| `"SUBGROUP"` \| `"COMMUNITY"`

The type of group

***

### id

> **id**: [`GroupChatId`](/reference/api/model/aliases/type-aliases/GroupChatId.md)

The chat id of the group [[GroupChatId]]

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

> **owner**: [`NonSerializedId`](/reference/api/model/aliases/type-aliases/NonSerializedId.md)

The id of the owner of the group [[ContactId]]

***

### participants

> **participants**: [`Participant`](/reference/api/model/group-metadata/interfaces/Participant.md)[]

An array of participants in the group

***

### pendingParticipants

> **pendingParticipants**: [`Participant`](/reference/api/model/group-metadata/interfaces/Participant.md)[]

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
