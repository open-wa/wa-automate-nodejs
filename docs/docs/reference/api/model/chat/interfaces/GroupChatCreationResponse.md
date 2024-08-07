# Interface: GroupChatCreationResponse

## Properties

### gid

> **gid**: [`GroupChatId`](/reference/api/model/aliases/type-aliases/GroupChatId.md)

The group chat id

***

### participants

> **participants**: `object`[]

The initial requested participants and their corresponding add responses

***

### status

> **status**: `200` \| `400`

The resultant status code of the group chat creation.

200 if the group was created successfully.

400 if the initial participant does not exist
