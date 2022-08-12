---
id: "api_model_label.Label"
title: "Interface: Label"
sidebar_label: "Label"
custom_edit_url: null
---

[api/model/label](/api/modules/api_model_label.md).Label

## Properties

### id

• **id**: `string`

The internal ID of the label. Usually a number represented as a string e.g "1"

___

### items

• **items**: { `id`: [`ChatId`](/api/types/api_model_aliases.ChatId.md) \| [`MessageId`](/api/types/api_model_aliases.MessageId.md) ; `type`: ``"Chat"`` \| ``"Contact"`` \| ``"Message"``  }[]

The items that are tagged with this label

___

### name

• **name**: `string`

The text contents of the label
