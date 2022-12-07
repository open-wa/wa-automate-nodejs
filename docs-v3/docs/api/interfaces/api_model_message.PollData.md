---
id: "api_model_message.PollData"
title: "Interface: PollData"
sidebar_label: "PollData"
custom_edit_url: null
---

[api/model/message](/api/modules/api_model_message.md).PollData

## Properties

### pollMessage

• **pollMessage**: [`Message`](/api/interfaces/api_model_message.Message.md)

The message object of the poll

___

### pollOptions

• **pollOptions**: [`PollOption`](/api/interfaces/api_model_message.PollOption.md) & { `count`: `number`  }[]

The poll options and their respective count of votes.

___

### totalVotes

• **totalVotes**: `number`

The total amount of votes recorded so far

___

### votes

• **votes**: [`PollVote`](/api/interfaces/api_model_message.PollVote.md)[]

An arrray of vote objects
