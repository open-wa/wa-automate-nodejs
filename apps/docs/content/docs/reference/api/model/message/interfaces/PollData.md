---
title: Interface - PollData
---

# Interface: PollData

## Properties

### pollMessage

> **pollMessage**: [`Message`](/docs/reference/api/model/message/interfaces/Message)

The message object of the poll

***

### pollOptions

> **pollOptions**: [`PollOption`](/docs/reference/api/model/message/interfaces/PollOption) & `object`[]

The poll options and their respective count of votes.

***

### totalVotes

> **totalVotes**: `number`

The total amount of votes recorded so far

***

### votes

> **votes**: [`PollVote`](/docs/reference/api/model/message/interfaces/PollVote)[]

An arrray of vote objects
