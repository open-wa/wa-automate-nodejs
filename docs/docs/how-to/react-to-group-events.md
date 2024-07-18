# Reacting To Group Events

For a specific group you can use [[onParticipantsChanged]], this will fire all detectable group participant change events (see: [[ParticipantChangedEventModel]]).

```javascript
import {
  create,
  Client,
  ParticipantChangedEventModel,
} from "@open-wa/wa-automate";

function start(client: Client) {
  const groupChatId = "00000000000-11111111111@g.us";
  client.onParticipantsChanged(
    groupChatId,
    async (changeEvent: ParticipantChangedEventModel) => {
      if (changeEvent.action == "add") {
        // It is possible that multiple accounts get added
        await Promise.all(
          changeEvent.who.map((number) =>
            client.sendTextWithMentions(
              groupChatId,
              `@${number} has been added!`
            )
          )
        );
      }
      if (changeEvent.action == "remove") {
        // It is possible that multiple accounts get removed
        //remember: all client methods are promises!
        await Promise.all(
          changeEvent.who.map((number) =>
            client.sendTextWithMentions(
              groupChatId,
              `@${number} has been removed!`
            )
          )
        );
      }
    }
  );
}

create().then((client) => start(client));
```

## Listening to participant change events from all groups

If you want to listen to participant change requests from all groups, you can get a list of all groups [[getAllChatIds]], filter for groups `.filter(id=>id.includes('@g.us')` then use the above method. However this results in multiple listeners in the browser and can have detrimental performance implications.

For better performance and stability you can use the Insiders Feature [[onGlobalParticipantsChanged]].

```javascript
import {
  create,
  Client,
  ParticipantChangedEventModel,
} from "@open-wa/wa-automate";

function start(client: Client) {
  client.onGlobalParticipantsChanged(
    async (changeEvent: ParticipantChangedEventModel) => {
      if (changeEvent.action == "add") {
        // It is possible that multiple accounts get added
        await Promise.all(
          changeEvent.who.map((number) =>
            client.sendTextWithMentions(
              changeEvent.chat,
              `@${number} has been added!`
            )
          )
        );
      }
      if (changeEvent.action == "remove") {
        // It is possible that multiple accounts get removed
        //remember: all client methods are promises!
        await Promise.all(
          changeEvent.who.map((number) =>
            client.sendTextWithMentions(
              changeEvent.chat,
              `@${number} has been removed!`
            )
          )
        );
      }
    }
  );
}

create().then((client) => start(client));
```