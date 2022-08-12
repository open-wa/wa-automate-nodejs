---
id: "api_model_reactions.ReactionEvent"
title: "Type alias: ReactionEvent"
sidebar_label: "ReactionEvent"
custom_edit_url: null
---

[api/model/reactions](/api/modules/api_model_reactions.md).ReactionEvent

Ƭ **ReactionEvent**: `Object`

Emitted by onReaction

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | [`Message`](/api/interfaces/api_model_message.Message.md) | The message being reacted to |
| `reactionByMe` | [`Reaction`](/api/types/api_model_reactions.Reaction.md) | The reaction sent by the host account |
| `reactions` | [`Reaction`](/api/types/api_model_reactions.Reaction.md)[] | An array of all reactions |
| `type` | ``"add"`` \| ``"change"`` | The type of the reaction event. |
