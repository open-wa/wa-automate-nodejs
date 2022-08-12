---
id: "api_model_reactions.ReactionRecord"
title: "Type alias: ReactionRecord"
sidebar_label: "ReactionRecord"
custom_edit_url: null
---

[api/model/reactions](/api/modules/api_model_reactions.md).ReactionRecord

Ƭ **ReactionRecord**: `Object`

The specific reaction by a user

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `ack` | [`MessageAck`](/api/enums/api_model_message.MessageAck.md) | The acknowledgement of the reaction |
| `id` | `string` | The ID of the reaction |
| `msgKey` | `string` | - |
| `orphan` | `number` | - |
| `parentMsgKey` | `string` | - |
| `reactionText` | `string` | The text of the reaction |
| `read` | `boolean` | If the reaction has been read |
| `senderUserJid` | [`ContactId`](/api/types/api_model_aliases.ContactId.md) | The ID of the reaction sender |
| `timestamp` | `number` | The timestamp of the reaction |
