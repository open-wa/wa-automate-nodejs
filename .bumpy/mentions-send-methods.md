---
"@open-wa/client": patch
"@open-wa/schema": patch
---

🐛 `sendTextWithMentions` and `sendReplyWithMentions` work. Both were documented, but calling them through the SDK, the Easy API or the socket client failed with "not implemented on Client". They now send the message and resolve to its ID.
🏷️ Tag people in the text as `@` followed by their number, for example `@447700000000`. `mentions` is optional and adds people the text doesn't tag, `hideTags` removes the tags from the text and still notifies the people, and nobody is mentioned twice when an ID is both tagged and listed.
🧯 A failed send throws `SendTextError` with a `code` and an `outcome`. `not_sent` means nothing was sent, and `unknown` means the message may have been sent, so check the chat before you retry.
