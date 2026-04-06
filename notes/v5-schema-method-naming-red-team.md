# Red Team: V5 Schema Method Naming Audit

> Pressure-testing the proposed naming conventions against industry standards.  
> Sources: Stripe, Twilio, Discord.js, Telegram Bot API, Google AIP, Microsoft REST Guidelines, whatsapp-web.js, Baileys

---

## 1. Industry Standards Matrix

| Standard | Collections | Singleton | Create | Update | Delete | Send (messaging) |
|---|---|---|---|---|---|---|
| **Stripe** | `list()` | `retrieve(id)` | `create()` | `update(id)` | `del(id)` | N/A |
| **Google AIP** | `List{Resource}` | `Get{Resource}` | `Create{Resource}` | `Update{Resource}` | `Delete{Resource}` | N/A |
| **Microsoft** | `list{Resources}` | `get{Resource}` | `create{Resource}` | `update{Resource}` | `delete{Resource}` | N/A |
| **Discord.js** | `.fetch()` / `.cache` | `.fetch(id)` | N/A | N/A | N/A | `channel.send()` |
| **Telegram** | `getUpdates` | `getChat` | N/A | N/A | `deleteMessage` | `sendMessage` |
| **whatsapp-web.js** | `fetchMessages()` | N/A | N/A | N/A | N/A | `sendMessage()` |
| **Baileys** | N/A | N/A | N/A | N/A | N/A | `sendMessage()` |
| **Our Audit** | `list{Resources}` | `get{Resource}` | `create{Resource}` | `set*`, `update*` | `delete{Resource}` | `send{Type}` |

---

## 2. Red Team Critique of the Audit

### ❌ ISSUE 1: `list*` may be the wrong convention for this SDK

**Audit says**: Rename all `getAll*` → `list*`

**Counter-argument**: This is a **flat SDK**, not a resource-oriented REST API. The `list` convention comes from REST APIs (Stripe, Google, Microsoft) where the verb describes a **paginated HTTP endpoint**. In flat client SDKs for messaging platforms, the convention is different:

| SDK | How they name "get all chats" |
|---|---|
| Telegram | `getChats` (not `listChats`) |
| Discord.js | `guild.channels.fetch()` or `.cache` |
| whatsapp-web.js | `client.getChats()` |
| Baileys | `store.chats.all()` |

**Verdict**: `getAll*` is actually the **more common convention in messaging SDKs**. The `list*` convention belongs to REST APIs with pagination. Since open-wa's client surface returns full arrays (no cursors, no pagination), `getAll*` is arguably more honest — it tells the consumer "you're getting ALL of them, in memory, right now."

**Recommendation**: 
- If planning to add pagination → adopt `list*`
- If staying with full-array returns → keep `get*` but **drop the `All` prefix when there's no singular counterpart** (e.g. `getChats()` not `getAllChats()` since there's already `getChat(id)`)
- Only use `getAll*` when disambiguation from a singular `get*` variant is needed AND pagination is not planned

---

### ❌ ISSUE 2: `sendVoiceNote` over `sendPtt` is debatable

**Audit says**: Rename `sendPtt` → `sendVoiceNote` because "PTT is internal WA jargon"

**Counter-argument**: PTT (Push-to-Talk) is **WhatsApp's official terminology** in their API documentation. It's the technical term used across:
- WhatsApp Business Cloud API (`type: "audio"` with `"ptt": true`)
- WhatsApp internal protocol (message type flags)
- All WA library ecosystems (wwebjs, Baileys both use PTT)

Renaming it removes domain-specific precision. Developers working with WhatsApp APIs **know** what PTT means. `voiceNote` is the consumer-facing UI term, not the technical term.

**Verdict**: Keep `sendPtt` but add a JSDoc alias mentioning "voice note" in the description.

---

### ❌ ISSUE 3: `isRegistered` hides critical return data

**Audit says**: Rename `checkNumberStatus` → `isRegistered`

**Counter-argument**: `checkNumberStatus` returns a **rich object** with data beyond just a boolean (business status, verified name, platform hints). `isRegistered` implies a `boolean` return. This rename would mislead consumers about what they're getting.

| Name | Implies return type | Actual return |
|---|---|---|
| `checkNumberStatus` | Status object | ✅ Correct |
| `isRegistered` | `boolean` | ❌ Misleading |

**Better alternative**: `getNumberStatus` — preserves the rich return type semantics while fixing the vague `check` verb.

---

### ❌ ISSUE 4: Namespace reorganization is over-engineered

**Audit says**: Split `utilities` into `session`, `diagnostics`, `profile`

**Counter-argument**: Adding 3 new namespaces creates cognitive overhead for a questionable gain. Consider:

- Stripe has **one** namespace per major resource
- Telegram has **zero** namespaces — everything is flat
- Discord.js uses **managers** (channel, message, user)

The misplaced methods in `utilities.ts` are a **file organization** problem, not a **namespace** problem. Moving `starMessage` from `utilities.ts` to `messaging.ts` doesn't require changing its `namespace: 'messages'` — the namespace is already correct in the schema metadata.

**Verdict**: Fix the file organization (move methods to correct files), but keep the namespace count minimal:
- `session` (absorb all of current `utilities` that are session-level)
- Keep `messages`, `chats`, `contacts`, `groups`, `communities`, `status`, `labels`, `business`, `media`
- Don't create `diagnostics` and `profile` — they're too granular. Roll them into `session`.

---

### ❌ ISSUE 5: `sendLinkPreview` for `sendYoutubeLink` is wrong

**Audit says**: Rename `sendYoutubeLink` → `sendLinkPreview`

**Counter-argument**: There are now **three** methods for sending links:
1. `sendYoutubeLink` (optimized YouTube preview with custom thumbnails)
2. `sendLinkWithAutoPreview` (generic link with auto-generated preview)
3. `sendMessageWithThumb` (link with manual thumbnail)

Renaming `sendYoutubeLink` to `sendLinkPreview` creates confusion because `sendLinkWithAutoPreview` **also** sends a link preview. The YouTube variant has **specific YT enrichments** (video metadata, thumbnail sizes).

**Better approach**: Keep the YouTube-specific name but clean it up:
- `sendYoutubeLink` → keep or rename to `sendYouTubeLink` (proper casing)  
- `sendLinkWithAutoPreview` → `sendLink`
- `sendMessageWithThumb` → `sendLinkWithThumbnail`

---

### ❌ ISSUE 6: The audit didn't address the biggest inconsistency — parameter naming for "target chat"

**Audit mentions it** but doesn't resolve the core tension:

| Context | Current | Audit Proposes |
|---|---|---|
| Sending a message | `to` | `to` ✅ |
| Reading a chat | `chatId` | `chatId` ✅ |
| Group operations | `groupId` | `groupId` ✅ |
| But `sendVCard` uses... | `chatId` | ??? |
| And `deleteMessage` uses... | `chatId` | ??? |

The audit proposes **"`to` for sends, `chatId` for reads"** but this creates a learning-curve discontinuity. Both Telegram and whatsapp-web.js use **one consistent parameter name**:

| SDK | Parameter name for target |
|---|---|
| Telegram | `chat_id` (always) |
| whatsapp-web.js | `chatId` (always) |

**Better approach**: Use `chatId` **everywhere**. The `to` alias was idiomatic for "send to somebody," but consistency > aesthetics. A single param name means one mental model.

---

### ❌ ISSUE 7: `reactToMessage` is verbose where competitors are concise

**Audit says**: Rename `react` → `reactToMessage`

**Counter-argument**: In the context of a messaging SDK, `react(messageId, emoji)` is unambiguous from the function signature. Adding `ToMessage` is redundant:

| SDK | React/Reaction method |
|---|---|
| Discord.js | `message.react(emoji)` |
| Telegram | `setMessageReaction(chat_id, message_id, reaction)` |
| This SDK | `react(messageId, emoji)` |

The function signature already implies "to a message" via the `messageId` parameter. However, Telegram's `setMessageReaction` pattern is closer to our flat-function style.

**Verdict**: Keep `react` — it's concise and clear from context. Or adopt Telegram's pattern: `setReaction`.

---

### ❌ ISSUE 8: `markAsSeen` for `sendSeen` may break WA ecosystem conventions

**Audit says**: Rename `sendSeen` → `markAsSeen`

**Counter-argument**: `sendSeen` mirrors WhatsApp's internal protocol — you are literally **sending a "seen" receipt** to the server. It's an active network operation, not a local state change. `markAsSeen` implies a local operation (like marking an email as read in a local IMAP cache).

| SDK | Read receipt method |
|---|---|
| Telegram | `readMessages(peer, max_id)` |
| Discord.js | `channel.messages.fetch()` (implicit) |
| whatsapp-web.js | `chat.sendSeen()` |

`sendSeen` is the WhatsApp ecosystem standard. Changing it would confuse users coming from whatsapp-web.js.

**Verdict**: Keep `sendSeen`. The "send" verb correctly communicates that a network round-trip is happening.

---

### 🟡 ISSUE 9: Missing deprecation strategy

The audit proposes a migration via aliases but doesn't define:
1. How long do aliases live? (1 major version? 2?)
2. How are they documented? (JSDoc `@deprecated`? Runtime warnings?)
3. What happens to plugin authors who use old names?

**Recommendation**: Define a concrete deprecation policy:
```
Phase 1 (v5.x): Add new names as primary, old names as aliases with @deprecated + runtime console.warn on first use
Phase 2 (v6.0): Remove aliases, breaking change
```

---

### 🟡 ISSUE 10: Some renames destroy discoverability

`getAmountOfLoadedMessages` → `getLoadedMessageCount` is fine.

But `extractVCards` (from `getVCards`) changes the verb class entirely — from a getter pattern to an action pattern. This breaks autocomplete discoverability for users typing `get` + Tab.

Consider: if a developer types `client.get` in their IDE, they expect to see all read operations. Moving `getVCards` to `extractVCards` removes it from that autocomplete group.

**Verdict**: Keep the `get` prefix for read operations: `getVCards` → leave as is, or `getVCardsFromMessage` if clarity is needed.

---

## 3. Revised Recommendation Summary

| Audit Proposal | Red Team Verdict | Final Recommendation |
|---|---|---|
| `getAll*` → `list*` | ❌ Over-corrects for this SDK type | Keep `get*` pattern; drop `All` when unambiguous |
| `sendPtt` → `sendVoiceNote` | ❌ Loses domain precision | Keep `sendPtt`, improve JSDoc |
| `checkNumberStatus` → `isRegistered` | ❌ Misleading return type | `getNumberStatus` |
| Split into `session`/`diagnostics`/`profile` | ❌ Over-segmented | Merge all into `session` namespace |
| `sendYoutubeLink` → `sendLinkPreview` | ❌ Name collision | Keep `sendYouTubeLink` (fix casing) |
| Use `to` for sends, `chatId` for reads | ❌ Inconsistent | Use `chatId` everywhere |
| `react` → `reactToMessage` | ❌ Unnecessarily verbose | Keep `react` or use `setReaction` |
| `sendSeen` → `markAsSeen` | ❌ Breaks ecosystem convention | Keep `sendSeen` |
| `getVCards` → `extractVCards` | ❌ Breaks autocomplete | Keep `getVCards` |
| `contactBlock` → `blockContact` | ✅ Correct | `blockContact` — verb-first is universal |
| `getBusinessProfilesProducts` → `listBusinessProducts` | ✅ Correct | `getBusinessProducts` (fix plural, keep `get`) |
| Move misplaced methods to correct files | ✅ Correct | Move methods, keep namespace count low |
| Standardize param names | ✅ Correct | `chatId` everywhere, `messageId` always |

---

## 4. Final Proposed Convention (Post Red-Team)

```
VERBS:
  get{Resource}       — single item by ID
  get{Resources}      — full collection (no pagination)
  send{Type}          — outbound message/media
  create{Resource}    — create new entity
  set{Property}       — update a setting/property
  delete{Resource}    — remove
  {action}{Resource}  — domain verbs (archive, mute, pin, block, forward, star, react)

PARAMS:
  chatId              — target chat (always, even for sends)
  contactId           — target contact
  groupId             — target group
  communityId         — target community
  messageId           — target message
  messageIds          — array of messages

NAMESPACES (10 total):
  session    — host info, connection, version, features, diagnostics, profile
  messages   — send, get, delete, forward, star, react, seen
  chats      — list, archive, mute, pin, clear, delete, ephemeral
  contacts   — list, get, block, unblock, profile pic, presence
  groups     — list, create, join, leave, settings, participants
  communities — list, info, members, admins
  status     — post, get, delete
  labels     — list, add, remove
  business   — profile, products, orders
  media      — decrypt, download
```
