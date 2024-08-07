# Interface: GenericGroupChangeEvent

## Properties

### author

> **author**: [`Contact`](/reference/api/model/contact/interfaces/Contact.md)

The contact who triggered this event. (E.g the contact who changed the group picture)

***

### body

> **body**: `string`

Some more information about the event

***

### groupMetadata

> **groupMetadata**: [`GroupMetadata`](/reference/api/model/group-metadata/interfaces/GroupMetadata.md)

***

### groupPic

> **groupPic**: `string`

Base 64 encoded image

***

### id

> **id**: [`MessageId`](/reference/api/model/aliases/type-aliases/MessageId.md)

***

### type

> **type**: `"remove"` \| `"add"` \| `"invite"` \| `"leave"` \| `"subject"` \| `"description"` \| `"announce"` \| `"restrict"` \| `"picutre"` \| `"create"` \| `"delete"` \| `"revoke_invite"` \| `"no_frequently_forwarded"` \| `"announce_msg_bounce"` \| `"demote"` \| `"promote"` \| `"modify"` \| `"v4_add_invite_sent"` \| `"v4_add_invite_join"` \| `"growth_locked"` \| `"growth_unlocked"` \| `"linked_group_join"`

Type of the event
