# Interface: PollData

## Properties

### pollMessage

> **pollMessage**: [`Message`](/reference/api/model/message/interfaces/Message.md)

The message object of the poll

***

### pollOptions

> **pollOptions**: [`PollOption`](/reference/api/model/message/interfaces/PollOption.md) & `object`[]

The poll options and their respective count of votes.

***

### totalVotes

> **totalVotes**: `number`

The total amount of votes recorded so far

***

### votes

> **votes**: [`PollVote`](/reference/api/model/message/interfaces/PollVote.md)[]

An arrray of vote objects
