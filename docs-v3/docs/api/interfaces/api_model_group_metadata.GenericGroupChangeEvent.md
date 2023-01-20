---
id: "api_model_group_metadata.GenericGroupChangeEvent"
title: "Interface: GenericGroupChangeEvent"
sidebar_label: "GenericGroupChangeEvent"
custom_edit_url: null
---

[api/model/group-metadata](/api/modules/api_model_group_metadata.md).GenericGroupChangeEvent

## Properties

### author

• **author**: [`Contact`](/api/interfaces/api_model_contact.Contact.md)

The contact who triggered this event. (E.g the contact who changed the group picture)

___

### body

• **body**: `string`

Some more information about the event

___

### groupMetadata

• **groupMetadata**: [`GroupMetadata`](/api/interfaces/api_model_group_metadata.GroupMetadata.md)

___

### groupPic

• **groupPic**: `string`

Base 64 encoded image

___

### id

• **id**: [`MessageId`](/api/types/api_model_aliases.MessageId.md)

___

### type

• **type**: ``"picutre"`` \| ``"create"`` \| ``"delete"`` \| ``"subject"`` \| ``"revoke_invite"`` \| ``"description"`` \| ``"restrict"`` \| ``"announce"`` \| ``"no_frequently_forwarded"`` \| ``"announce_msg_bounce"`` \| ``"add"`` \| ``"remove"`` \| ``"demote"`` \| ``"promote"`` \| ``"invite"`` \| ``"leave"`` \| ``"modify"`` \| ``"v4_add_invite_sent"`` \| ``"v4_add_invite_join"`` \| ``"growth_locked"`` \| ``"growth_unlocked"`` \| ``"linked_group_join"``

Type of the event
