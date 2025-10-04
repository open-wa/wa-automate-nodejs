# Manage Participants

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
