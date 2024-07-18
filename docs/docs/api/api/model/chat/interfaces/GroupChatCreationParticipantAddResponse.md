# Interface: GroupChatCreationParticipantAddResponse

## Properties

### code

> **code**: `200` \| `400` \| `403`

The resultant status code for adding the participant. 

200 if the participant was added successfully during the creation of the group. 

403 if the participant does not allow their account to be added to group chats. If you receive a 403, you will also get an `invite_code` and `invite_code_exp`

***

### invite\_code?

> `optional` **invite\_code**: `string`

If the participant is not allowed to be added to group chats due to their privacy settings, you will receive an `invite_code` which you can send to them via a text.

***

### invite\_code\_exp?

> `optional` **invite\_code\_exp**: `string`

The expiry ts of the invite_code. It is a number wrapped in a string, in order to get the proper time you can use this:

```javascript
  new Date(Number(invite_code_exp)*1000)
```
