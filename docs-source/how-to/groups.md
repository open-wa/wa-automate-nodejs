# Group

## Create a Group

Use [[createGroup]] to create a new group, first parameter is the group name, the second parameter is the contact ids to add as participants. There needs to be at least one participant.

```javascript
...
  client.createGroup('Cool new group','xxxxxxxxx@c.us') //you can also send an array of ids.
...
```

## Managing Participants

[[addParticipant]] - add a participant
[[removeParticipant]] -  remove a particpant
[[promoteParticipant]] - Make a participant admin
[[demoteParticipant]] -  remove participant as admin

```javascript
...
  client.addParticipant('XXXXXXX-YYYYYY@c.us','ZZZZZZZZZ@c.us')
  client.removeParticipant('XXXXXXX-YYYYYY@c.us','ZZZZZZZZZ@c.us')
  client.promoteParticipant('XXXXXXX-YYYYYY@c.us','ZZZZZZZZZ@c.us')
  client.demoteParticipant('XXXXXXX-YYYYYY@c.us','ZZZZZZZZZ@c.us')
...
```

## Listening to participant changes of a specific group

You can react to when participants are added and removed. [[onParticipantsChanged]] emits a [[ParticipantChangedEventModel]].

```javascript
client.onParticipantsChanged("XXXXXXXX-YYYYYYYY@g.us", (participantChangedEvent) => console.log("participant changed for group", participantChangedEvent));

//participantChangedEvent returns
{
  by: 'XXXXXXXXXXX@c.us', //who performed the action
  action: 'remove',
  who: [ 'XXXXXXXXX@c.us' ] //all the numbers the action effects.
}
```

This solution can result in some false positives and misfires however a lot of effort has been made to mitigate this to a reasonable level. Best practice is to maintian a seperate registry of participants and go from that.

## Listen to participant changes globally

[[onGlobalParicipantsChanged]] is a simple and memory efficient way to listen to all participant changes from all groups. This is an Insider's Feature.

```javascript
client.onGlobalParicipantsChanged((participantChangedEvent) => console.log("participant changed for group", participantChangedEvent));

//participantChangedEvent returns
{
  by: 'XXXXXXXXXXX@c.us', //who performed the action
  action: 'remove',
  who: [ 'XXXXXXXXX@c.us' ] //all the numbers the action effects.
}
```
