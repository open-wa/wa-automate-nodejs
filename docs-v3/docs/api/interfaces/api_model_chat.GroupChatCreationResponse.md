---
id: "api_model_chat.GroupChatCreationResponse"
title: "Interface: GroupChatCreationResponse"
sidebar_label: "GroupChatCreationResponse"
custom_edit_url: null
---

[api/model/chat](/api/modules/api_model_chat.md).GroupChatCreationResponse

## Properties

### gid

• **gid**: [`GroupChatId`](/api/types/api_model_aliases.GroupChatId.md)

The group chat id

___

### participants

• **participants**: { `ContactId?`: [`GroupChatCreationParticipantAddResponse`](/api/interfaces/api_model_chat.GroupChatCreationParticipantAddResponse.md)  }[]

The initial requested participants and their corresponding add responses

___

### status

• **status**: ``200`` \| ``400``

The resultant status code of the group chat creation.

200 if the group was created successfully.

400 if the initial participant does not exist
