# Interface: PollData

## Properties

### pollMessage

> **pollMessage**: [`Message`](/api/api/model/message/interfaces/Message.md)

The message object of the poll

***

### pollOptions

> **pollOptions**: [`PollOption`](/api/api/model/message/interfaces/PollOption.md) & `object`[]

The poll options and their respective count of votes.

***

### totalVotes

> **totalVotes**: `number`

The total amount of votes recorded so far

***

### votes

> **votes**: [`PollVote`](/api/api/model/message/interfaces/PollVote.md)[]

An arrray of vote objects
