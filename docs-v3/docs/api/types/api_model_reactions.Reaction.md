---
id: "api_model_reactions.Reaction"
title: "Type alias: Reaction"
sidebar_label: "Reaction"
custom_edit_url: null
---

[api/model/reactions](/api/modules/api_model_reactions.md).Reaction

Ƭ **Reaction**: `Object`

A reaction is identified the specific emoji.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `aggregateEmoji` | `string` | The aggregate emoji used for the reaction. |
| `hasReactionByMe` | `boolean` | If the reaction is also sent by the host account |
| `id` | `string` | The identifier of the reaction |
| `senders` | [`ReactionRecord`](/api/types/api_model_reactions.ReactionRecord.md)[] | The senders of this spefcific reaction |
