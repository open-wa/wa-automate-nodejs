# V5 Schema Design Specification

> Consolidated from: naming audit, red-team critique, and maintainer decisions.
> This is the **authoritative** design document for the open-wa v5 schema system.

---

## 1. Design Goals

1. **Easiest library to migrate to** — users from whatsapp-web.js, Baileys, Telegram Bot API, or v4 should feel at home immediately
2. **Dual-surface client** — generate both a **flat** client (`client.getAllChats()`) and a **namespaced** client (`client.chats.getAll()`)
3. **Backwards compatibility** — v5 keeps 100% compat with v4 method names and parameter names via aliases; breaking changes deferred to v6
4. **Maintainer DX** — namespace-organized source files with structured metadata; aliases are auto-generated from structured `verb`/`noun`/`extra` metadata
5. **No creepy/spammy features** — `checkNumberStatus` / `isRegistered` are deliberately excluded from the public API

---

## 2. Naming Conventions (Final Decisions)

### 2.1 Method Name Conventions

| Pattern | When | Examples |
|---|---|---|
| `get{Resource}` | Single item by ID | `getChat`, `getContact`, `getGroupInfo` |
| `get{Resources}` / `getAll{Resources}` | Full collection (no pagination) | `getAllChats`, `getAllContacts` |
| `send{Type}` | Outbound message/media | `sendText`, `sendImage`, `sendPtt` |
| `create{Resource}` | Create new entity | `createGroup` |
| `set{Property}` | Update a setting/property | `setGroupTitle`, `setMyName` |
| `delete{Resource}` | Remove | `deleteChat`, `deleteMessage` |
| `{action}{Resource}` | Domain verbs | `archiveChat`, `muteChat`, `pinChat`, `blockContact`, `forwardMessages`, `starMessage`, `react` |
| `post{Type}Status` | Status/story posts | `postTextStatus`, `postImageStatus` |

### 2.2 Decisions from Red-Team Review

| Issue | Decision | Rationale |
|---|---|---|
| `getAll*` vs `list*` | **Keep `getAll*` as primary, `list*` as alias** | Messaging SDKs use `get*`; `list*` belongs to REST APIs with pagination. We have no pagination. |
| `sendPtt` vs `sendVoiceNote` | **Keep `sendPtt` as primary, `sendVoiceNote` as alias** | PTT is WhatsApp ecosystem standard. `voiceNote` added as alias for newcomers. |
| `checkNumberStatus` / `isRegistered` | **Keep `checkNumberStatus` as licensed feature** (`license: 'insiders'`). Remove `isRegistered`. | Legitimate use cases exist (CRM integrations). Gate behind license to prevent abuse. |
| Namespace splitting | **Keep namespaces as-is for source organization; generate both flat + namespaced client** | Namespaces are good for maintainer DX. Users get flat client for compat, namespaced for discovery. |
| `sendYoutubeLink` | **Keep `sendYouTubeLink` (fix casing)** | YouTube-specific enrichments are distinct from generic link preview. |
| `react` vs `reactToMessage` | **Keep `react` as primary** | Concise and unambiguous from function signature (`messageId`, `emoji`). |
| `sendSeen` vs `markAsSeen` | **Keep `sendSeen`** | WhatsApp ecosystem convention; `send` correctly implies a network round-trip. |
| `getVCards` vs `extractVCards` | **Keep `getVCards`** | `get*` prefix preserves autocomplete discoverability. |
| `contactBlock` / `contactUnblock` | **Rename to `blockContact` / `unblockContact`** | Verb-first is universal in JS. Old names become deprecated aliases. |
| `getBusinessProfilesProducts` | **Rename to `getBusinessProducts`** | Fix pluralization. Old name becomes deprecated alias. |
| `getProfilePicFromServer` | **Rename to `getProfilePicture`** | `FromServer` is implementation detail. Old name becomes deprecated alias. |
| Param name `chatId` everywhere vs `to` for sends | **Keep both via param alias system** | `to` is idiomatic for sends, `chatId` is consistent. Both work. v4 compat preserved. |

---

## 3. The Alias System

### 3.1 Structured Alias Metadata

Each method definition gains a new `aliases` block in its `meta`. Aliases are **generated from structured components** plus optional explicit overrides:

```typescript
export interface AliasMetadata {
    /** Structured verb/noun/extra for auto-generating aliases */
    verb: string;           // e.g. "get", "send", "set", "delete", "archive"
    noun: string;           // e.g. "chats", "message", "contact", "group"
    extra?: string;         // e.g. "all", "byId", "withMessages"
    
    /** Explicit additional aliases (for things that can't be auto-generated) */
    explicit?: string[];    // e.g. ["sendVoiceNote"] for sendPtt
    
    /** Deprecated aliases (v4 compat, removed in v6) */
    deprecated?: string[];  // e.g. ["contactBlock"] for blockContact
}
```

### 3.2 Alias Generation Rules

From the structured `verb`/`noun`/`extra`, the system auto-generates aliases following these patterns:

| Pattern | Generated From | Example |
|---|---|---|
| **Flat camelCase** (primary) | Defined in `defineMethodV2` name | `getAllChats` |
| **Namespaced** | `{namespace}.{verb}{Extra}` | `chats.getAll` |
| **Stripe-style** | `{verb}{Noun}` | `listChats` (alias for `getAllChats`) |
| **Baileys-style** | `{namespace}.{extra}` (when applicable) | `chats.all` |

**Explicitly excluded patterns** (not generated):
- ❌ Discord-style: `chats.fetch()` / `.cache` — too ORM-like for this SDK
- ❌ Google AIP-style: `ListChats` (PascalCase) — not JS convention

### 3.3 Generation Algorithm

```
function generateAliases(meta: AliasMetadata, namespace: string): string[] {
    const aliases: string[] = [];
    const { verb, noun, extra } = meta;
    
    // Pattern 1: namespace.verbExtra → "chats.getAll"
    if (extra) {
        aliases.push(`${namespace}.${verb}${capitalize(extra)}`);
    } else {
        aliases.push(`${namespace}.${verb}`);
    }
    
    // Pattern 2: Stripe-style listX for getAll → "listChats" 
    if (verb === 'get' && extra === 'all') {
        aliases.push(`list${capitalize(noun)}`);
        aliases.push(`${namespace}.list`);
    }
    
    // Pattern 3: Baileys-style namespace.extra → "chats.all"
    if (extra) {
        aliases.push(`${namespace}.${extra}`);
    }
    
    // Add explicit aliases
    aliases.push(...(meta.explicit || []));
    
    // Add deprecated aliases (tagged separately)
    // These get runtime console.warn on first use
    
    return deduplicate(aliases);
}
```

### 3.4 Example: `getAllChats`

```typescript
export const getAllChats = defineMethodV2('getAllChats', {
    meta: {
        description: 'Retrieves all chats',
        action: 'read',
        namespace: 'chats',
        license: 'none',
        functionality: 'both',
        httpMethod: 'GET',
        aliases: {
            verb: 'get',
            noun: 'chats',
            extra: 'all',
            explicit: [],        // nothing extra needed
            deprecated: [],      // no v4 legacy names to carry
        }
    },
    input: z.object({
        withNewMessagesOnly: withNewMessagesOnlyParam
    }),
    parameterOrder: ['withNewMessagesOnly'],
    output: z.array(z.any())
});
```

**Generated surface:**

| Surface | Access | Type |
|---|---|---|
| `client.getAllChats()` | Flat client (primary) | Primary |
| `client.chats.getAll()` | Namespaced client | Generated |
| `client.listChats()` | Flat alias (Stripe-style) | Generated |
| `client.chats.list()` | Namespaced alias | Generated |
| `client.chats.all()` | Namespaced alias (Baileys-style) | Generated |

**HTTP API:** `GET /api/chats/getAll` (derived from namespace + verb + extra)

### 3.5 Example: `sendPtt`

```typescript
export const sendPtt = defineMethodV2('sendPtt', {
    meta: {
        description: 'Sends a voice note (push-to-talk) to a chat',
        action: 'send',
        namespace: 'messages',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
        aliases: {
            verb: 'send',
            noun: 'ptt',
            extra: undefined,
            explicit: ['sendVoiceNote'],   // human-friendly alias
            deprecated: [],
        }
    },
    // ...
});
```

**Generated surface:**

| Surface | Access | Type |
|---|---|---|
| `client.sendPtt()` | Flat (primary) | Primary |
| `client.messages.sendPtt()` | Namespaced | Generated |
| `client.sendVoiceNote()` | Flat alias | Explicit |
| `client.messages.sendVoiceNote()` | Namespaced alias | Explicit |

### 3.6 Example: `blockContact` (with deprecated alias)

```typescript
export const blockContact = defineMethodV2('blockContact', {
    meta: {
        description: 'Block a contact',
        action: 'update',
        namespace: 'contacts',
        license: 'none',
        functionality: 'both',
        httpMethod: 'PUT',
        aliases: {
            verb: 'block',
            noun: 'contact',
            extra: undefined,
            explicit: [],
            deprecated: ['contactBlock'],  // v4 name, removed in v6
        }
    },
    input: z.object({
        contactId: contactIdParam    // renamed from `id`
    }),
    parameterOrder: ['contactId'],
    output: z.boolean()
});
```

---

## 4. Parameter Alias System

### 4.1 The Problem

v4 uses inconsistent parameter names for the same concept:

| Concept | Current variants |
|---|---|
| Target chat/recipient | `to`, `chatId`, `id`, `contactId` (in chats.ts) |
| Contact | `id`, `contactId` |
| Group | `groupId`, `chatId`, `groupChatId` |
| Message | `messageId`, `msgId`, `id` |

Changing these breaks v4 users who pass `{ to: '...' }` as JSON to the HTTP API or use positional args.

### 4.2 Solution: Parameter Aliases on the Schema Itself

Parameter aliases are declared **on the parameter schema's registry metadata**, NOT repeated in every method's `meta`. Since `toParam` already knows it's a `ChatId` parameter, it also knows what alias key names it accepts. Every method using `toParam` inherits these aliases for free.

```typescript
export interface ParameterMetadata {
    /** Example value for docs / Postman / OpenAPI */
    example: string | number | boolean | string[];
    /** Branded type name (for doc generation) */
    brandedType?: string;
    /** Human-readable format description */
    formatDescription?: string;
    /** Regex pattern string for validation docs */
    pattern?: string;
    /** Additional example values keyed by variant name */
    additionalExamples?: Record<string, string>;
    
    /** Alternative key names accepted for this parameter */
    keyAliases?: string[];
    /** Deprecated key names (trigger console.warn on first use) */
    deprecatedKeyAliases?: string[];
}
```

Parameter alias info is attached once, on the parameter schema:

```typescript
export const toParam = ChatIdSchema
    .describe('Recipient chat ID')
    .register(parameterRegistry, {
        example: '447123456789@c.us',
        brandedType: 'ChatId',
        keyAliases: ['chatId'],           // accepts { chatId: '...' } → normalized to { to: '...' }
        deprecatedKeyAliases: [],
    });

export const contentParam = z.string().min(1)
    .describe('Message content')
    .register(parameterRegistry, {
        example: 'Hello World!',
        brandedType: 'Content',
        keyAliases: ['text', 'body', 'message'],  // all normalize to 'content'
        deprecatedKeyAliases: [],
    });
```

### 4.3 Where Normalization Happens

Parameter key normalization happens at the **schema boundary** via `z.preprocess()` (see Section 14). The alias map is derived automatically from the input schema's shape by reading each field's registry metadata:

```typescript
function buildKeyAliasMap(inputShape: Record<string, z.ZodTypeAny>): Record<string, string> {
    const map: Record<string, string> = {};
    for (const [canonicalKey, schema] of Object.entries(inputShape)) {
        const meta = parameterRegistry.get(schema);
        if (meta?.keyAliases) {
            for (const alias of meta.keyAliases) {
                map[alias] = canonicalKey;
            }
        }
        if (meta?.deprecatedKeyAliases) {
            for (const alias of meta.deprecatedKeyAliases) {
                map[alias] = canonicalKey;
            }
        }
    }
    return map;
}
```

This runs in three layers — all converging on the same derived alias map:

1. **`implementMethod()` resolver** — wraps the input schema in `z.preprocess(normalizeKeys, inputSchema)`
2. **HTTP API layer** — Hono middleware normalizes incoming JSON body keys
3. **Socket API layer** — `ask()` handler normalizes keys before dispatch

### 4.4 Schema-Level Declaration

Because aliases live on the parameter schema, method definitions stay clean — **no `paramAliases` in meta**:

```typescript
export const sendText = defineMethodV2('sendText', {
    meta: {
        description: 'Sends a text message to a chat',
        action: 'send',
        namespace: 'messages',
        aliases: { verb: 'send', noun: 'text' }
    },
    input: z.object({
        to: toParam,            // ← toParam knows it accepts 'chatId' as alias
        content: contentParam,  // ← contentParam knows it accepts 'text', 'body', 'message'
        options: messageOptionsParam
    }),
    parameterOrder: ['to', 'content', 'options'],
    output: MessageIdReturnSchema.or(z.boolean()).or(z.string())
});

// All of these just work:
client.sendText({ to: '447@c.us', content: 'Hi' });       // canonical
client.sendText({ chatId: '447@c.us', body: 'Hi' });      // aliases → normalized automatically
client.sendText({ chatId: '447@c.us', message: 'Hi' });   // aliases → normalized automatically
```

### 4.5 Canonical Parameter Names (Standardized)

| Concept | Canonical | Accepted aliases | Deprecated (removed in v6) |
|---|---|---|---|
| Target chat (in sends) | `to` | `chatId` | — |
| Target chat (in reads) | `chatId` | `id`, `contactId` (when used as chat) | — |
| Contact | `contactId` | `id` (in contact context) | — |
| Group | `groupId` | `chatId`, `groupChatId` | `groupChatId` |
| Community | `communityId` | — | — |
| Message | `messageId` | `msgId`, `id` (in message context) | `msgId` |
| Multiple messages | `messageIds` | `messages` | — |

> **Key principle:** We do NOT change the canonical names from v4 — we **accept more names**. `to` stays `to` for sends, `chatId` stays `chatId` for reads. We just accept the other names as aliases so users migrating from other libraries don't need to learn our conventions immediately.

---

## 5. Deprecation Strategy

### 5.1 Lifecycle

```
Phase 1 (v5.x):  
  - New names become primary (in docs, autocomplete, JSDoc)
  - Old names work as aliases with @deprecated JSDoc tag
  - First use of deprecated alias triggers console.warn (once per name per session)
  
Phase 2 (v6.0):
  - Remove all deprecated aliases (breaking change)
  - Update migration guide
```

### 5.2 Deprecated Method Names (v4 → v5)

| v4 Name (deprecated) | v5 Name (primary) | Reason |
|---|---|---|
| `contactBlock` | `blockContact` | Verb-first is universal in JS |
| `contactUnblock` | `unblockContact` | Same |
| `getBusinessProfilesProducts` | `getBusinessProducts` | Fix pluralization |
| `getProfilePicFromServer` | `getProfilePicture` | `FromServer` is implementation detail |
| `getGptArray` | `getMessagesForLLM` | Vendor-neutral naming |
| `getAmountOfLoadedMessages` | `getLoadedMessageCount` | Verbose → concise |
| `getGeneratedUserAgent` | `getUserAgent` | `Generated` is implementation detail |
| `getIsPlugged` | `isPlugged` | `getIs*` is awkward phrasing |
| `getChatById` | *(remove, keep `getChat`)* | Exact duplicate of `getChat` |

### 5.3 Deprecated Parameter Names (v4 → v5)

| v4 Param (deprecated) | v5 Canonical | Methods affected |
|---|---|---|
| `groupChatId` | `groupId` | `approveGroupJoinRequest`, `rejectGroupJoinRequest` |
| `msgId` | `messageId` | `getVCards` |
| `userA` | `userAgent` | `getGeneratedUserAgent` / `getUserAgent` |
| `newName` | `name` | `setMyName` |
| `newStatus` | `statusText` | `setMyStatus` |

---

## 6. Generated Client Surfaces

The code generator (`gen-client-implementation.ts`) produces **three** outputs from the schema:

### 6.1 Flat Client (`BaseClient`)

The existing generated output. Every method is a direct property of the client:

```typescript
class BaseClient {
    public getAllChats = implementMethod(Methods.getAllChats);
    public sendText = implementMethod(Methods.sendText);
    // ... all 120+ methods flat
    
    // Generated aliases (from alias metadata):
    /** @deprecated Use blockContact instead */
    public contactBlock = this.blockContact;
    public listChats = this.getAllChats;
    public sendVoiceNote = this.sendPtt;
}
```

### 6.2 Namespaced Client (`NamespacedClient`)

**NEW** — auto-generated from namespace metadata:

```typescript
interface NamespacedClient {
    chats: {
        getAll(params?: { withNewMessagesOnly?: boolean }): Promise<any[]>;
        get(params: { chatId: string }): Promise<any>;
        getAllIds(): Promise<string[]>;
        archive(params: { chatId: string }): Promise<boolean>;
        // ... etc
    };
    messages: {
        sendText(params: { to: string; content: string; options?: any }): Promise<any>;
        sendImage(params: { to: string; imgData: string; ... }): Promise<any>;
        getById(params: { messageId: string }): Promise<any>;
        // ... etc
    };
    contacts: { ... };
    groups: { ... };
    communities: { ... };
    status: { ... };
    labels: { ... };
    business: { ... };
    media: { ... };
    session: { ... };
}
```

**Generation rules for namespaced method names:**

The namespaced name is derived by **stripping the namespace noun** (singular or plural) from the flat method name. This is the default behavior — there is no utility in `client.chats.deleteChat()` when `client.deleteChat()` already exists.

> **Feature Flag:** Namespace noun stripping is controlled by a `STRIP_NAMESPACE_NOUN` flag (default: `true`). This can be toggled across versions if needed.

**Stripping algorithm:**

1. Identify the namespace noun in singular and plural forms (e.g. `Chat`/`Chats`, `Group`/`Groups`, `Message`/`Messages`)
2. Strip the noun from the **end** of the flat name (suffix stripping) — this is the common case
3. If the noun appears as a **prefix** instead (e.g. `getGroupMembers` in the `groups` namespace), strip from the prefix
4. If stripping produces an ambiguous or empty result, use explicit `namespacedName` override in metadata
5. If the noun does NOT appear in the flat name at all (e.g. `sendText` in `messages`), the full flat name passes through unchanged

> **Authority:** The catalog in Section 9 is the **authoritative source** for every method's namespaced name. The algorithm here is a guideline — Section 9 overrides in all edge cases.

| Flat name | Namespace | Namespaced name | Rule |
|---|---|---|---|
| `getAllChats` | `chats` | `chats.getAll` | Strip `Chats` suffix |
| `getChat` | `chats` | `chats.get` | Strip `Chat` suffix |
| `archiveChat` | `chats` | `chats.archive` | Strip `Chat` suffix |
| `deleteChat` | `chats` | `chats.delete` | Strip `Chat` suffix (**NOT** `chats.deleteChat`) |
| `sendText` | `messages` | `messages.sendText` | No match — full name passes through |
| `deleteMessage` | `messages` | `messages.delete` | Strip `Message` suffix |
| `getGroupMembers` | `groups` | `groups.getMembers` | Strip `Group` prefix |
| `blockContact` | `contacts` | `contacts.block` | Strip `Contact` suffix |
| `sendMultipleContacts` | `messages` | `messages.sendContacts` | No `Message` suffix — but explicit alias `sendContacts` used |
| `markAsRead` | `chats` | `chats.markAsRead` | No `Chat` in name — full name passes through |

Edge cases use explicit `namespacedName` override in metadata when the auto-stripping produces ambiguous results.

> **Documentation rule:** Every method's TypeDoc MUST list all its aliases at the top of the JSDoc. This eliminates the "what's the difference between `client.deleteChat` and `client.chats.delete`?" question — the user hovers, sees "this is an alias of X", done.

### 6.3 HTTP API Routes

Generated from namespace + method name:

```
GET  /api/chats/getAll
GET  /api/chats/get?chatId=...
PUT  /api/chats/archive
POST /api/messages/sendText
POST /api/messages/sendImage
GET  /api/contacts/getAll
PUT  /api/contacts/block
```

### 6.4 HTTP Alias Routing (308 Redirect + Alias Header)

Alias routes use **308 permanent redirects** to the canonical route, with an `X-OpenWA-Aliases` response header listing all known aliases:

```
GET  /api/chats/list          → 308 Redirect to /api/chats/getAll
     Response Headers:
       Location: /api/chats/getAll
       X-OpenWA-Aliases: GET /api/chats/getAll, GET /api/chats/list, GET /api/chats/all

POST /api/messages/sendVoiceNote → 308 Redirect to /api/messages/sendPtt
     Response Headers:
       Location: /api/messages/sendPtt
       X-OpenWA-Aliases: POST /api/messages/sendPtt, POST /api/messages/sendVoiceNote
```

**Why 308, not 301:** Per RFC 7231, 301 redirects allow clients to change POST/PUT/DELETE to GET, which would **drop the request body**. 308 (RFC 7538) is the permanent redirect that **preserves the HTTP method and body**, making it safe for all methods including POST.

**Rationale:** 308s maintain easy DX (clients auto-follow redirects) and minimize maintainer clutter (each method has ONE handler, aliases are just redirect entries). The `X-OpenWA-Aliases` header provides discoverability so API consumers can discover all available routes.

This is registered in the Hono app as:

```typescript
// In HTTP route generation:
for (const alias of method.aliases) {
  app[httpMethod](aliasRoute, (c) => {
    const allAliases = method.allRoutes.map(r => `${httpMethod.toUpperCase()} ${r}`).join(', ');
    return c.redirect(canonicalRoute, 308, {
      'X-OpenWA-Aliases': allAliases
    });
  });
}
```

---

## 7. Source File Organization

### 7.1 Namespace → File Mapping

Methods live in source files matching their namespace. Methods currently misplaced (in `utilities.ts` or `media.ts`) should be **moved to their correct namespace file**.

| Namespace | Source file | Methods |
|---|---|---|
| `session` | `session.ts` | `getMe`, `getHostNumber`, `getConnectionState`, `getWAVersion` `getBatteryLevel`, `isPlugged`, `getFeatures`, `getLicenseType`, `getUserAgent`, `getProcessStats`, `getLoadedMessageCount`, `getSnapshot`, `healthCheck`, `setMyName`, `setMyStatus`, `setProfilePicture` |
| `messages` | `messaging.ts` | All `send*`, `deleteMessage`, `getMessage`, `getAllMessages`, `forwardMessages`, `starMessage`, `unstarMessage`, `react`, `sendSeen`, `getMyLastMessage`, `getStarredMessages`, `getUnsentMessages`, `getMessageInfo`, `getVCards`, `getMessagesForLLM`, `loadEarlierMessages`, `sendFileFromUrl` |
| `chats` | `chats.ts` | *(as current)* |
| `contacts` | `contacts.ts` | *(as current)* — includes `checkNumberStatus` (licensed: `insiders`) |
| `groups` | `groups.ts` | *(as current)* |
| `communities` | `communities.ts` | *(as current)* |
| `status` | `status.ts` | *(as current)* |
| `labels` | `labels.ts` | *(as current)* |
| `business` | `business.ts` | *(as current)* |
| `media` | `media.ts` | `decryptMedia`, `downloadMedia` only |

### 7.2 Methods to Move

| Method | From | To | Namespace change? |
|---|---|---|---|
| `getMyLastMessage` | `utilities.ts` | `messaging.ts` | No (already `messages`) |
| `getStarredMessages` | `utilities.ts` | `messaging.ts` | No |
| `getUnsentMessages` | `utilities.ts` | `messaging.ts` | No |
| `getMessageInfo` | `utilities.ts` | `messaging.ts` | No |
| `getVCards` | `utilities.ts` | `messaging.ts` | No |
| `getGptArray` / `getMessagesForLLM` | `utilities.ts` | `messaging.ts` | No |
| `starMessage` | `utilities.ts` | `messaging.ts` | No |
| `unstarMessage` | `utilities.ts` | `messaging.ts` | No |
| `react` | `utilities.ts` | `messaging.ts` | No |
| `sendSeen` | `utilities.ts` | `messaging.ts` | No |
| `sendFileFromUrl` | `media.ts` | `messaging.ts` | No (already `messages`) |
| `loadEarlierMessages` | `media.ts` | `messaging.ts` | No (already `messages`) |
| `getMe` etc. | `utilities.ts` | `session.ts` (**new**) | `utilities` → `session` |

### 7.3 The `utilities.ts` Farewell

After moving all methods out, `utilities.ts` is **deleted**. The `utilities` namespace ceases to exist. All former utility methods join `session`.

---

## 8. Methods Removed / Gated

| Method | Status | Reason |
|---|---|---|
| `checkNumberStatus` | **Licensed** (`insiders`) | Legitimate use cases exist (CRM integrations). Gated behind license to prevent abuse. Name unchanged. |
| `isRegistered` | **❌ Removed** | Redundant with `checkNumberStatus`. Anti-abuse posture. |
| `getChatById` | **Alias** of `getChat` | Exact duplicate. Kept as explicit alias for backward compat, not as a standalone method. |

---

## 9. Complete Method Catalog with Aliases

### 9.1 `chats` namespace

| # | Primary Name | Structured Alias | Explicit Aliases | Deprecated | Namespaced |
|---|---|---|---|---|---|
| 1 | `getAllChats` | `verb:get noun:chats extra:all` | — | — | `chats.getAll` |
| 2 | `getAllChatIds` | `verb:get noun:chatIds extra:all` | — | — | `chats.getAllIds` |
| 3 | `getAllChatsWithMessages` | `verb:get noun:chats extra:allWithMessages` | — | — | `chats.getAllWithMessages` |
| 4 | `getChat` | `verb:get noun:chat` | `getChatById` | — | `chats.get` |
| 5 | `getChatWithNonContacts` | `verb:get noun:chats extra:withNonContacts` | — | — | `chats.getWithNonContacts` |
| 6 | `archiveChat` | `verb:archive noun:chat` | — | — | `chats.archive` |
| 7 | `unarchiveChat` | `verb:unarchive noun:chat` | — | — | `chats.unarchive` |
| 8 | `clearChat` | `verb:clear noun:chat` | — | — | `chats.clear` |
| 9 | `deleteChat` | `verb:delete noun:chat` | — | — | `chats.delete` |
| 10 | `pinChat` | `verb:pin noun:chat` | — | — | `chats.pin` |
| 11 | `unpinChat` | `verb:unpin noun:chat` | — | — | `chats.unpin` |
| 12 | `muteChat` | `verb:mute noun:chat` | — | — | `chats.mute` |
| 13 | `unmuteChat` | `verb:unmute noun:chat` | — | — | `chats.unmute` |
| 14 | `markAsRead` | *(override)* | — | — | `chats.markAsRead` |
| 15 | `markAsUnread` | *(override)* | — | — | `chats.markAsUnread` |
| 16 | `setChatEphemeral` | `verb:set noun:ephemeral` | — | — | `chats.setEphemeral` |
| 17 | `isChatOnline` | `verb:is noun:online` | — | — | `chats.isOnline` |

> **Note:** Only the `chats` namespace (9.1) shows the "Structured Alias" column as a reference example. All other namespace tables omit it for brevity — the same `verb`/`noun`/`extra` pattern applies. Methods marked *(override)* use explicit `namespacedName` metadata because they don't decompose cleanly into `verb`/`noun` (e.g. compound verbs like `markAs`).

### 9.2 `messages` namespace

| # | Primary Name | Explicit Aliases | Deprecated | Namespaced |
|---|---|---|---|---|
| 18 | `sendText` | — | — | `messages.sendText` |
| 19 | `sendTextWithMentions` | — | — | `messages.sendTextWithMentions` |
| 20 | `sendReplyWithMentions` | — | — | `messages.sendReplyWithMentions` |
| 21 | `sendPaymentRequest` | — | — | `messages.sendPaymentRequest` |
| 22 | `sendImage` | — | — | `messages.sendImage` |
| 23 | `sendFile` | — | — | `messages.sendFile` |
| 24 | `sendAudio` | — | — | `messages.sendAudio` |
| 25 | `sendPtt` | `sendVoiceNote` | — | `messages.sendPtt`, `messages.sendVoiceNote` |
| 26 | `sendVideoAsGif` | — | — | `messages.sendVideoAsGif` |
| 27 | `sendLocation` | — | — | `messages.sendLocation` |
| 28 | `sendVCard` | — | — | `messages.sendVCard` |
| 29 | `sendContact` | — | — | `messages.sendContact` |
| 30 | `sendMultipleContacts` | `sendContacts` | — | `messages.sendContacts` |
| 31 | `sendButtons` | — | — *(deprecated feature, not name)* | `messages.sendButtons` |
| 32 | `sendAdvancedButtons` | — | — *(deprecated feature)* | `messages.sendAdvancedButtons` |
| 33 | `sendListMessage` | `sendList` | — | `messages.sendList` |
| 34 | `sendPoll` | — | — | `messages.sendPoll` |
| 35 | `sendBanner` | — | — | `messages.sendBanner` |
| 36 | `sendYouTubeLink` | — | `sendYoutubeLink` (casing fix) | `messages.sendYouTubeLink` |
| 37 | `sendLinkWithAutoPreview` | `sendLink` | — | `messages.sendLink` |
| 38 | `sendMessageWithThumb` | `sendLinkWithThumbnail` | — | `messages.sendLinkWithThumbnail` |
| 39 | `forwardMessages` | — | — | `messages.forward` |
| 40 | `deleteMessage` | — | — | `messages.delete` |
| 41 | `getMessageById` | `getMessage` | — | `messages.get`, `messages.getById` |
| 42 | `getAllMessages` | — | — | `messages.getAll` |
| 43 | `getMyLastMessage` | — | — | `messages.getMyLast` |
| 44 | `getStarredMessages` | — | — | `messages.getStarred` |
| 45 | `getUnsentMessages` | — | — | `messages.getUnsent` |
| 46 | `getMessageInfo` | — | — | `messages.getInfo` |
| 47 | `getVCards` | — | — | `messages.getVCards` |
| 48 | `getMessagesForLLM` | — | `getGptArray` | `messages.getForLLM` |
| 49 | `starMessage` | — | — | `messages.star` |
| 50 | `unstarMessage` | — | — | `messages.unstar` |
| 51 | `react` | — | — | `messages.react` |
| 52 | `sendSeen` | — | — | `messages.sendSeen` |
| 53 | `loadEarlierMessages` | `loadOlderMessages` | — | `messages.loadEarlier` |
| 54 | `sendFileFromUrl` | — | — | `messages.sendFileFromUrl` |

### 9.3 `contacts` namespace

| # | Primary Name | Explicit Aliases | Deprecated | License | Namespaced |
|---|---|---|---|---|---|
| 55 | `getAllContacts` | — | — | `none` | `contacts.getAll` |
| 56 | `getContact` | — | — | `none` | `contacts.get` |
| 57 | `getCommonGroups` | — | — | `none` | `contacts.getCommonGroups` |
| 58 | `getNumberProfile` | — | — | `none` | `contacts.getNumberProfile` |
| 59 | `getBlockedIds` | — | — | `none` | `contacts.getBlockedIds` |
| 60 | `blockContact` | — | `contactBlock` | `none` | `contacts.block` |
| 61 | `unblockContact` | — | `contactUnblock` | `none` | `contacts.unblock` |
| 62 | `checkReadReceipts` | `getReadReceipts` | — | `none` | `contacts.getReadReceipts` |
| 63 | `getProfilePicture` | — | `getProfilePicFromServer` | `none` | `contacts.getProfilePicture` |
| 64 | `checkNumberStatus` | — | — | `insiders` | `contacts.checkNumberStatus` |

### 9.4 `groups` namespace

| # | Primary Name | Explicit Aliases | Deprecated | Namespaced |
|---|---|---|---|---|
| 65 | `getGroupMembers` | — | — | `groups.getMembers` |
| 66 | `getAllGroups` | — | — | `groups.getAll` |
| 67 | `getGroupMembersId` | `getGroupMemberIds` | — | `groups.getMemberIds` |
| 68 | `getGroupInfo` | — | — | `groups.getInfo` |
| 69 | `getGroupAdmins` | — | — | `groups.getAdmins` |
| 70 | `getKickedGroups` | — | — | `groups.getKicked` |
| 71 | `getGroupInviteLink` | — | — | `groups.getInviteLink` |
| 72 | `createGroup` | — | — | `groups.create` |
| 73 | `leaveGroup` | — | — | `groups.leave` |
| 74 | `joinGroupViaLink` | `joinGroup` | — | `groups.join` |
| 75 | `revokeGroupInviteLink` | — | — | `groups.revokeInviteLink` |
| 76 | `setGroupTitle` | — | — | `groups.setTitle` |
| 77 | `setGroupDescription` | — | — | `groups.setDescription` |
| 78 | `setGroupIcon` | — | — | `groups.setIcon` |
| 79 | `setGroupToAdminsOnly` | — | — | `groups.setAdminsOnly` |
| 80 | `setGroupEditToAdminsOnly` | — | — | `groups.setEditAdminsOnly` |
| 81 | `addParticipant` | `addGroupParticipant` | — | `groups.addParticipant` |
| 82 | `removeParticipant` | `removeGroupParticipant` | — | `groups.removeParticipant` |
| 83 | `promoteParticipant` | `promoteGroupParticipant` | — | `groups.promoteParticipant` |
| 84 | `demoteParticipant` | `demoteGroupParticipant` | — | `groups.demoteParticipant` |
| 85 | `approveGroupJoinRequest` | — | — | `groups.approveJoinRequest` |
| 86 | `rejectGroupJoinRequest` | — | — | `groups.rejectJoinRequest` |

### 9.5 `communities` namespace

| # | Primary Name | Namespaced |
|---|---|---|
| 87 | `getAllCommunities` | `communities.getAll` |
| 88 | `getCommunityInfo` | `communities.getInfo` |
| 89 | `getCommunityParticipantIds` | `communities.getParticipantIds` |
| 90 | `getCommunityAdminIds` | `communities.getAdminIds` |
| 91 | `getCommunityParticipants` | `communities.getParticipants` |
| 92 | `getCommunityAdmins` | `communities.getAdmins` |

### 9.6 `status` namespace

| # | Primary Name | Explicit Aliases | Deprecated | Namespaced |
|---|---|---|---|---|
| 93 | `postTextStatus` | — | — | `status.postText` |
| 94 | `postImageStatus` | — | — | `status.postImage` |
| 95 | `postVideoStatus` | — | — | `status.postVideo` |
| 96 | `getStories` | `getStatuses` | — | `status.getAll` |
| 97 | `getStatus` | — | — | `status.get` |
| 98 | `deleteStatus` | — | — | `status.delete` |
| 99 | `deleteAllStatus` | `deleteAllStatuses` | — | `status.deleteAll` |

### 9.7 `labels` namespace

| # | Primary Name | Namespaced |
|---|---|---|
| 100 | `getAllLabels` | `labels.getAll` |
| 101 | `getChatsByLabel` | `labels.getChats` |
| 102 | `addLabel` | `labels.add` |
| 103 | `removeLabel` | `labels.remove` |

### 9.8 `business` namespace

| # | Primary Name | Deprecated | Namespaced |
|---|---|---|---|
| 104 | `getBusinessProfile` | — | `business.getProfile` |
| 105 | `getBusinessProducts` | `getBusinessProfilesProducts` | `business.getProducts` |
| 106 | `getOrder` | — | `business.getOrder` |

### 9.9 `media` namespace

| # | Primary Name | Namespaced |
|---|---|---|
| 107 | `decryptMedia` | `media.decrypt` |
| 108 | `downloadMedia` | `media.download` |

### 9.10 `session` namespace (formerly `utilities`)

| # | Primary Name | Explicit Aliases | Deprecated | Namespaced |
|---|---|---|---|---|
| 109 | `getMe` | — | — | `session.getMe` |
| 110 | `getHostNumber` | — | — | `session.getHostNumber` |
| 111 | `getConnectionState` | — | — | `session.getConnectionState` |
| 112 | `getWAVersion` | `getWhatsAppVersion` | — | `session.getWAVersion` |
| 113 | `getBatteryLevel` | — | — | `session.getBatteryLevel` |
| 114 | `isPlugged` | — | `getIsPlugged` | `session.isPlugged` |
| 115 | `getFeatures` | — | — | `session.getFeatures` |
| 116 | `getLicenseType` | — | — | `session.getLicenseType` |
| 117 | `getUserAgent` | — | `getGeneratedUserAgent` | `session.getUserAgent` |
| 118 | `getProcessStats` | — | — | `session.getProcessStats` |
| 119 | `getLoadedMessageCount` | — | `getAmountOfLoadedMessages` | `session.getLoadedMessageCount` |
| 120 | `getSnapshot` | `takeScreenshot` | — | `session.getSnapshot` |
| 121 | `healthCheck` | — | — | `session.healthCheck` |
| 122 | `setMyName` | `setDisplayName` | — | `session.setName` |
| 123 | `setMyStatus` | `setStatusText` | — | `session.setStatus` |
| 124 | `setProfilePicture` | — | `setProfilePic` | `session.setProfilePicture` |

---

## 10. Implementation Plan

### 10.1 Phase 1: Schema Infrastructure Changes

**Files to modify:**

#### `registry.ts` — Add alias metadata types

```typescript
// Add to ClientFunctionMetadata:
export interface ClientFunctionMetadata {
    // ... existing fields ...
    
    /** Structured alias generation metadata */
    aliases?: {
        verb: string;
        noun: string;
        extra?: string;
        explicit?: string[];
        deprecated?: string[];
    };
    
    // NOTE: paramAliases are NOT here — they live on ParameterMetadata
    // in the z.registry() attached to each parameter schema (see Section 4.2)
}
```

#### `registry.ts` — Extend `clientRegistry` with alias registration

```typescript
// Add to clientRegistry:
const methodsByAlias = new Map<string, string>(); // alias → primary name

register(def: MethodDefinition): z.ZodFunction<any, any> {
    // ... existing registration ...
    
    // Register aliases with collision detection
    if (def.meta.aliases) {
        const generated = generateAliases(def.meta.aliases, def.meta.namespace);
        for (const alias of generated) {
            const existing = methodsByAlias.get(alias);
            if (existing && existing !== def.meta.functionName) {
                throw new Error(
                    `Alias collision: "${alias}" is claimed by both ` +
                    `"${existing}" and "${def.meta.functionName}". ` +
                    `Use explicit namespacedName override to resolve.`
                );
            }
            methodsByAlias.set(alias, def.meta.functionName);
        }
    }
}

/** Resolve a name (primary or alias) to the method definition */
resolve(nameOrAlias: string): MethodDefinition | undefined {
    const primary = methodsByAlias.get(nameOrAlias);
    return this.get(primary || nameOrAlias);
}
```

#### `implementor.ts` — Add parameter normalization

Add `z.preprocess(normalizeKeys, inputSchema)` wrapper before dispatching to implementation. The `normalizeKeys` function derives its alias map from `buildKeyAliasMap(inputSchema.shape)` — reading each parameter schema's `keyAliases` from the `z.registry()` metadata. No per-method `paramAliases` configuration needed.

### 10.2 Phase 2: Method Definitions Update

1. Add `aliases` metadata to every method definition in `methods/*.ts`
2. Rename methods that need renaming (e.g. `contactBlock` → `blockContact`)
3. Verify `keyAliases` on parameter schemas (Section 4.2) cover all v4 legacy parameter names
4. Create `session.ts` and move methods from `utilities.ts`
5. Move misplaced methods from `media.ts` and `utilities.ts` to correct files
6. Delete `utilities.ts`

### 10.3 Phase 3: Code Generator Updates

Update `gen-client-implementation.ts` to generate:

1. **`BaseClient.ts`** — flat client with all aliases as properties
2. **`BaseNamespacedClient.ts`** — **NEW** — namespaced client with `client.chats.*`, `client.messages.*` etc.
3. **`AliasMap.ts`** — **NEW** — runtime-importable map of `{ alias: primaryName }` for HTTP/socket layers
4. Updated OpenAPI spec with alias routes

### 10.4 Phase 4: HTTP + Socket Layer

1. Update Hono router to register alias routes → 308 redirect to canonical handler
2. Update socket `ask()` to resolve alias method names via `clientRegistry.resolve()`
3. Add JSON body key normalization using per-method `buildKeyAliasMap()` derived from parameter registry metadata (Section 4.3)

### 10.5 Phase 5: Documentation

1. Auto-generate migration guide from deprecated aliases metadata
2. Update README with dual-surface examples
3. Add `@deprecated` JSDoc tags to all deprecated aliases in generated output

---

## 11. Resolved Research Items

| # | Item | Decision | Rationale |
|---|---|---|---|
| ~~1~~ | ~~**Namespaced name derivation**~~ | ~~**Strip namespace noun by default** (feature-flagged via `STRIP_NAMESPACE_NOUN`). `deleteChat` → `chats.delete`, NOT `chats.deleteChat`. Use explicit `namespacedName` override for edge cases.~~ | ~~No utility in using the namespace if names are duplicated. Feature flag allows toggling per-version.~~ |
| ~~2~~ | ~~**HTTP alias routing**~~ | ~~**308 permanent redirect** to canonical route, with `X-OpenWA-Aliases` response header listing all `[HTTP method] route` combos. 308 (not 301) to preserve HTTP method and body for POST/PUT/DELETE.~~ | ~~Maintains easy DX (clients auto-follow), minimal maintainer clutter (one handler per method), and alias discoverability via header.~~ |
| ~~3~~ | ~~**TypeScript types for namespaced client**~~ | ~~**Inputs use Zod-inferred types** (`z.infer<typeof input>`), **outputs use compiled types**. Generated client has full type annotations for autocomplete.~~ | ~~Zod inference for inputs gives accurate transform-aware types; compiled output types give clean, stable API surface.~~ |
| ~~4~~ | ~~**Runtime vs build-time alias resolution**~~ | ~~**Prepopulated at registration time** (Map pre-filled during `clientRegistry.register()`).~~ | ~~Maximum dev DX — zero lazy lookup overhead at call time. Bundle size impact is negligible (alias→primaryName string map).~~ |
| ~~5~~ | ~~**`getAll*` as both flat and namespaced**~~ | ~~**Yes, keep all surfaces**. Confusion mitigated by **docs**: every method's TypeDoc lists all aliases at top. Root method docs say "Aliases: X, Y, Z". Alias docs say "Alias of: rootMethod". Deprecated alias docs say "Deprecated alias of: rootMethod".~~ | ~~Clear docs eliminate confusion. Multiple access paths serve different user personas (v4, Stripe-style, Baileys-style).~~ |
| ~~6~~ | ~~**Positional arg order unchanged**~~ | ~~**Critical: v4 positional order MUST be preserved**. JSON arg key normalization uses `z.preprocess()` to remap alias keys to canonical keys BEFORE Zod validation.~~ | ~~v4 positional callers must not break. JSON callers using legacy key names get seamless normalization.~~ |
| ~~7~~ | ~~**Branded type examples**~~ | ~~**→ RESOLVED: Section 12** (Zod 4 `.meta()` + `z.registry()` replaces custom `parameterRegistry` WeakMap)~~ | ~~Native Zod 4 infrastructure.~~ |

---

## 12. Zod 4 Native Infrastructure

> **Critical migration:** Zod 4.3.6 is installed. The current codebase uses a custom `WeakMap`-based `parameterRegistry` and a `createZodCodec()` wrapper. **All of this must be replaced with native Zod 4 features.** This section specifies the migration.

### 12.1 What Zod 4 Gives Us (Empirically Verified)

The following features have been **tested and confirmed working** with Zod 4.3.6:

| Feature | API | What it does |
|---|---|---|
| **Native Codecs** | `z.codec(inputSchema, outputSchema, { decode, encode })` | Bidirectional transform with validation on both sides |
| **Codec Operations** | `z.decode(codec, value)` / `z.encode(codec, value)` | Execute codec in either direction |
| **Native Registry** | `z.registry<T>()` | Strongly-typed metadata registry (replaces our custom WeakMap) |
| **Inline Registration** | `schema.register(registry, metadata)` | Attach metadata inline during schema creation |
| **Native Metadata** | `schema.meta({ ... })` | Attach metadata to `z.globalRegistry` |
| **Native JSON Schema** | `z.toJSONSchema(schema)` | Replaces `zod-to-json-schema` dependency |
| **OpenAPI Target** | `z.toJSONSchema(schema, { target: 'openapi-3.0' })` | Native OpenAPI 3.0 generation |
| **String Validators** | `.regex()`, `.endsWith()`, `.startsWith()`, `.includes()`, `.trim()`, `.toLowerCase()` | Rich string validation/normalization |
| **Transform + Pipe** | `.transform(fn).pipe(outputSchema)` | Normalize THEN validate output |
| **Branding** | `.brand('TypeName')` | Compile-time nominal types, zero runtime cost |
| **Preprocess** | `z.preprocess(fn, schema)` | Transform raw input before schema validation |
| **Top-level Formats** | `z.email()`, `z.url()`, `z.uuid()`, `z.ip()`, `z.iso.datetime()` | New Zod 4 string format validators |

### 12.2 Migration: Custom Registry → Native `z.registry()`

#### BEFORE (current `registry.ts`):

```typescript
// Custom WeakMap-based registry
export interface ParameterMetadata {
    example?: any;
}
const parameterMetadataMap = new WeakMap<z.ZodTypeAny, ParameterMetadata>();
export const parameterRegistry = {
    set<T extends z.ZodTypeAny>(schema: T, metadata: ParameterMetadata): T { ... },
    get<T extends z.ZodTypeAny>(schema: T): ParameterMetadata | undefined { ... }
};
```

#### AFTER (native Zod 4):

```typescript
import { z } from 'zod';

/**
 * Structured metadata for every parameter schema.
 * Replaces the old { example?: any } with full branded type info.
 */
export interface ParameterMetadata {
    /** Example value for docs / Postman / OpenAPI */
    example: string | number | boolean | string[];
    /** Branded type name (for doc generation) */
    brandedType?: string;
    /** Human-readable format description */
    formatDescription?: string;
    /** Regex pattern string for validation docs */
    pattern?: string;
    /** Additional example values keyed by variant name */
    additionalExamples?: Record<string, string>;
    
    /** Alternative key names accepted for this parameter (Section 4.2) */
    keyAliases?: string[];
    /** Deprecated key names (trigger console.warn on first use) */
    deprecatedKeyAliases?: string[];
}

/**
 * Native Zod 4 registry — strongly typed, GC-safe.
 * Replaces the custom WeakMap parameterMetadataMap.
 */
export const parameterRegistry = z.registry<ParameterMetadata>();
```

#### BEFORE (current `parameters.ts`):

```typescript
export const chatIdParam = ChatIdCodecSchema.describe('Chat ID');
parameterRegistry.set(chatIdParam, { example: '447123456789@c.us' });
```

#### AFTER (native `.register()`):

```typescript
export const chatIdParam = ChatIdSchema
    .describe('Chat ID (phone number or formatted ID)')
    .register(parameterRegistry, {
        example: '447123456789@c.us',
        brandedType: 'ChatId',
        formatDescription: 'A contact ID (digits@c.us) or group ID (digits-digits@g.us)',
        pattern: '^\\d+(-\\d+)?@(c|g)\\.us$',
        additionalExamples: {
            contact: '447123456789@c.us',
            group: '447123456789-1445627445@g.us',
        }
    });
```

### 12.3 Migration: Custom `createZodCodec()` → Native `z.codec()`

#### BEFORE (current `codecs.ts`):

```typescript
// Custom wrapper — the file even has a comment saying "I don't know if z.codec exists"
export const createZodCodec = <I extends z.ZodTypeAny, O>(
    inputSchema: I,
    codec: { decode; encode }
) => inputSchema.transform(codec.decode);

export const ChatIdCodecSchema = createZodCodec(z.string(), chatIdCodec);
```

#### AFTER (native `z.codec()` with output validation):

```typescript
/**
 * ChatId Codec — native Zod 4 bidirectional transform.
 * 
 * Input: any string (raw phone number or formatted ID)
 * Output: validated, normalized ChatId matching the regex pattern
 * 
 * The output schema includes .regex() so Zod REJECTS malformed
 * IDs after normalization — preventing bad params from reaching
 * the WA session and potentially crashing it.
 */
export const ChatIdSchema = z.codec(
    z.string(),                                        // accept any string input
    z.string().regex(/^\d+(-\d+)?@(c|g)\.us$|^\d+@lid$/).brand('ChatId'),  // output MUST match
    {
        decode: (input: string): string => {
            if (input.includes('@')) return input;
            const digits = input.replace(/\D/g, '');
            if (digits.length === 18) return `${digits}@g.us`;
            if (digits.length === 14 && !digits.startsWith('62')) return `${digits}@lid`;
            return `${digits}@c.us`;
        },
        encode: (chatId: string): string => chatId
    }
);

export const ContactIdSchema = z.codec(
    z.string(),
    z.string().regex(/^\d+@c\.us$/).brand('ContactId'),
    {
        decode: (input: string): string => {
            if (input.endsWith('@c.us')) return input;
            return `${input.replace(/\D/g, '')}@c.us`;
        },
        encode: (id: string): string => id
    }
);

export const GroupIdSchema = z.codec(
    z.string(),
    z.string().regex(/^\d+(-\d+)?@g\.us$/).brand('GroupChatId'),
    {
        decode: (input: string): string => {
            if (input.endsWith('@g.us')) return input;
            return `${input.replace(/\D/g, '')}@g.us`;
        },
        encode: (id: string): string => id
    }
);

export const MessageIdSchema = z.codec(
    z.string(),
    z.string().regex(/^(true|false)_.+_.+$/).brand('MessageId'),
    {
        decode: (input: string): string => input,  // no normalization, just validation
        encode: (id: string): string => id
    }
);
```

**Key insight:** The output schema now has `.regex()` validation, so if a codec's `decode()` function produces a malformed ID, **Zod will throw** instead of silently passing garbage to the WhatsApp session. This is a critical safety improvement over V4's `pup()` which blindly appended suffixes.

### 12.4 Migration: `zod-to-json-schema` → Native `z.toJSONSchema()`

```typescript
// BEFORE:
import zodToJsonSchema from 'zod-to-json-schema';
const json = zodToJsonSchema(schema);

// AFTER (native, with .meta() metadata automatically included):
const json = z.toJSONSchema(schema); // JSON Schema draft-2020-12
const openApi = z.toJSONSchema(schema, { target: 'openapi-3.0' });
```

`.meta()` data (descriptions, examples) is **automatically included** in the generated JSON Schema — no manual plumbing.

### 12.5 Impact: `@asteasolutions/zod-to-openapi` Dependency

With native `z.toJSONSchema()` + OpenAPI target, the `@asteasolutions/zod-to-openapi` dependency may be **removable**. Evaluation needed during implementation — keep it if it provides features beyond what `z.toJSONSchema({ target: 'openapi-3.0' })` offers (e.g. `$ref` component registration).

---

## 13. Zod Codec-Based Input Normalization

> This section replaces the V4 `pup()` auto-suffix logic with a Zod-native, per-schema normalization pipeline.

### 13.1 The V4 Problem

V4's `pup()` function in `Client.ts` had a hardcoded parameter name list:

```typescript
// V4 Client.ts line ~615
const idParams = ['to', 'chatId', 'groupChatId', 'groupId', 'contactId'];
for (const param of idParams) {
    if (args[param] && !args[param].includes('@')) {
        args[param] += '@c.us';  // blindly append suffix
    }
}
```

Problems:
1. **Hardcoded** — adding a new ID-shaped parameter required editing `pup()`
2. **No validation** — `pup()` never checked if the result was a valid ID
3. **No type narrowing** — TypeScript saw `string`, not `ChatId`
4. **Wrong suffix for groups** — appending `@c.us` to a group number silently broke

### 13.2 The V5 Solution: Normalization IN the Schema

Every ID parameter schema is a `z.codec()` that:
1. **Accepts** raw strings (phone numbers, partial IDs)
2. **Normalizes** them to the correct format (auto-suffix)
3. **Validates** the output matches the expected regex
4. **Brands** the output type for compile-time safety

```
User input: "447123456789"             ← raw phone number
     ↓ z.decode(ChatIdSchema)
Codec decode: "447123456789@c.us"      ← auto-suffixed
     ↓ output schema validation
Regex check: /^\d+(-\d+)?@(c|g)\.us$/  ← VALIDATED
     ↓ .brand('ChatId')
Final type: ChatId (branded string)    ← type-safe
```

If the codec produces a malformed ID (e.g. empty string, wrong suffix), the output schema's `.regex()` validation **rejects it** before it reaches the WhatsApp session.

### 13.3 Where Normalization Runs

Normalization happens at the **schema boundary** — when `z.decode()` or `.parse()` is called:

> **Codec `.parse()` = decode direction.** In Zod 4, calling `.parse()` on a codec schema runs the **decode** function (external → internal). Calling `z.encode()` runs the reverse direction (internal → external). When a codec is nested inside a `z.object()`, calling `.parse()` on the parent object **automatically triggers decode** on nested codec fields. No explicit `z.decode()` call is needed.

| Layer | How normalization is triggered |
|---|---|
| **SDK Client** | `implementMethod()` calls `.parse()` on input schema (triggers codec decode on nested ID fields) |
| **HTTP API** | Hono middleware calls `.parse()` on request body schema |
| **Socket API** | `ask()` handler calls `.parse()` on incoming payload schema |

All three layers converge on the same Zod codec — **one definition, three consumers**.

### 13.4 Full Validator Inventory for String Schemas

Zod 4 provides the following string validators/transforms, all of which are available for parameter schemas:

```typescript
// Validation (reject if doesn't match)
z.string().regex(/pattern/)
z.string().endsWith('@c.us')
z.string().startsWith('data:')
z.string().includes('@')
z.string().min(10)
z.string().max(255)

// Transformation (mutate the value)
z.string().trim()
z.string().toLowerCase()
z.string().toUpperCase()

// Combo: normalize THEN validate
z.string()
    .transform(input => input.trim().replace(/\D/g, '') + '@c.us')  // normalize
    .pipe(z.string().regex(/^\d+@c\.us$/))                          // validate output

// Top-level format validators (Zod 4)
z.email()
z.url()
z.uuid()
z.ip()
z.iso.datetime()
```

### 13.5 Example: SendText Input Schema with Full Normalization

```typescript
export const sendText = defineMethodV2('sendText', {
    meta: { /* ... */ },
    input: z.object({
        to: ChatIdSchema,       // ← codec auto-normalizes "447123456789" → "447123456789@c.us"
        content: z.string().min(1),
        options: z.any().optional()
    }),
    parameterOrder: ['to', 'content', 'options'],
    output: z.string()  // NOTE: simplified for illustration. Full schema is MessageIdReturnSchema.or(z.boolean()).or(z.string())
});

// Usage — all of these work (.parse() triggers codec decode on `to` field automatically):
sendText.parse({ to: '447123456789', content: 'Hi' });        // raw phone → auto-suffixed
sendText.parse({ to: '447123456789@c.us', content: 'Hi' });   // already formatted → passthrough
sendText.parse({ to: '447123456789-123@g.us', content: 'Hi' }); // group → passthrough
```

---

## 14. Parameter Key Alias Normalization

> This section specifies how legacy parameter **names** (keys) are normalized to canonical names before Zod validation.

### 14.1 The Problem

A V4 user sends JSON to the HTTP API:

```json
{ "chatId": "447123456789@c.us", "body": "Hello" }
```

But V5's canonical parameter names are `to` and `content`. The JSON must be **key-normalized** before Zod sees it.

### 14.2 Solution: `z.preprocess()` Key Normalization (Per-Method)

Each method's input schema is wrapped in `z.preprocess()` that remaps alias keys to canonical keys. The alias map is **derived from the parameter schema's registry metadata** (Section 4.3), NOT a global static map.

> **Why per-method, not global?** A global `chatId → to` mapping would break read methods like `getChat({ chatId })` where `chatId` IS the canonical key. The `buildKeyAliasMap()` function (Section 4.3) only creates mappings for keys that exist as `keyAliases` on parameters in **that specific method's** input schema.

```typescript
// Per-method alias map derived from Section 4.3's buildKeyAliasMap():
// For sendText: { chatId: 'to', body: 'content', text: 'content', message: 'content' }
// For getChat:  { id: 'chatId', contactId: 'chatId' }  ← chatId is NOT remapped!

function normalizeKeys(aliasMap: Record<string, string>) {
    return (data: unknown): unknown => {
        if (typeof data !== 'object' || data === null) return data;
        const obj = data as Record<string, unknown>;
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            const canonical = aliasMap[key] || key;
            // First-writer wins: canonical key takes priority over alias
            if (!(canonical in result)) {
                result[canonical] = value;
            }
        }
        return result;
    };
}

// Usage in method registration:
const sendTextAliasMap = buildKeyAliasMap(sendTextInputSchema.shape); // from Section 4.3
const sendTextInput = z.preprocess(
    normalizeKeys(sendTextAliasMap),
    z.object({
        to: ChatIdSchema,
        content: z.string().min(1),
        options: z.any().optional()
    })
);
```

### 14.3 Verified Behavior (Tested)

```typescript
// Canonical keys → pass through
sendTextInput.parse({ to: '447@c.us', content: 'Hello' });
// → { to: '447@c.us', content: 'Hello' }

// Alias "chatId" → normalized to "to"
sendTextInput.parse({ chatId: '447@c.us', content: 'Hello' });
// → { to: '447@c.us', content: 'Hello' }

// Alias "body" → normalized to "content"
sendTextInput.parse({ to: '447@c.us', body: 'Hi' });
// → { to: '447@c.us', content: 'Hi' }

// Both aliased
sendTextInput.parse({ chatId: '447@c.us', text: 'Hey' });
// → { to: '447@c.us', content: 'Hey' }
```

### 14.4 Positional Args Are Unaffected

Key normalization only applies to **object-style** calls. Positional args use the `parameterOrder` tuple and are **order-based**, not key-based. V4 positional order is preserved exactly.

---

## 15. Branded Parameter Types

### 15.1 Background: The V4 System

In V4, TypeScript branded types (`ChatId`, `ContactId`, `MessageId`, etc.) served **three purposes simultaneously**:

1. **Compile-time type safety** — `ChatId` vs `ContactId` are different types even though both are `string` at runtime
2. **Documentation generation** — when `ts-morph` introspected `sendText(to: ChatId, content: Content)`, it extracted the type name `"ChatId"` and looked it up in `aliasExamples` to produce Postman example values
3. **Auto-suffix logic** — the `pup()` method in `Client.ts` inspected parameter names and auto-appended `@c.us` or `@g.us` if missing

This system worked but was **fragile**: the Postman examples lived in a separate `build-postman.ts` file, the auto-suffix logic was hardcoded in `pup()`, and the branded types had no runtime representation.

### 15.2 V5 Design: All Three in One Zod Schema

V5 **unifies all three V4 mechanisms** into a single Zod codec + registry entry:

| V4 Mechanism | V5 Replacement | Where it lives |
|---|---|---|
| `Brand<string, "ChatId">` compile-time | `.brand('ChatId')` on output schema | `z.codec()` output schema |
| `aliasExamples["ChatId"]` in `build-postman.ts` | `.register(parameterRegistry, { example: '...' })` | `z.registry()` metadata |
| `pup()` auto-suffix | `decode:` function inside `z.codec()` | `z.codec()` decode |
| `ts-morph` type name extraction | `parameterRegistry.get(schema).brandedType` | `z.registry()` metadata |
| No output validation | `.regex()` on codec output schema | `z.codec()` output schema |

This means a single `ChatIdSchema` definition provides:
- ✅ Input normalization (raw number → formatted ID)
- ✅ Output validation (regex rejects malformed IDs)
- ✅ Compile-time branding (TypeScript nominal type)
- ✅ Documentation metadata (example, format description, pattern)
- ✅ JSON Schema / OpenAPI generation (via `z.toJSONSchema()` + `.meta()`)

### 15.3 Branded Type Catalog

| Branded Type | V5 Schema | Pattern | Primary Example | Normalization |
|---|---|---|---|---|
| `ChatId` | `ChatIdSchema` | `^\d+(-\d+)?@(c\|g)\.us$\|^\d+@lid$` | `447123456789@c.us` | Auto-suffix based on digit count |
| `ContactId` | `ContactIdSchema` | `^\d+@c\.us$` | `447123456789@c.us` | Always append `@c.us` |
| `GroupChatId` | `GroupIdSchema` | `^\d+(-\d+)?@g\.us$` | `447123456789-1445627445@g.us` | Always append `@g.us` |
| `MessageId` | `MessageIdSchema` | `^(true\|false)_.+_.+$` | `false_447123456789@c.us_9C4D...` | Validate only, no transform |
| `Content` | `z.string().min(1).brand('Content')` | *(free text)* | `Hello World!` | None |
| `DataURL` | `FileToDataUrlSchema` | `^data:.+;base64,.+$` | `data:image/png;base64,iVBOR...` | Path/URL → DataURL conversion |
| `AdvancedFile` | `FileToDataUrlSchema` | DataURL, path, or URL | `data:image/png;base64,...` | Multi-source → DataURL |

### 15.4 Parameter-to-Branded-Type Mapping

| Parameter Name | Branded Type | Codec Schema | Used In |
|---|---|---|---|
| `to` | `ChatId` | `ChatIdSchema` | All `send*` methods |
| `chatId` | `ChatId` | `ChatIdSchema` | `getChat`, `archiveChat`, `muteChat`, etc. |
| `contactId` | `ContactId` | `ContactIdSchema` | `getContact`, `blockContact`, etc. |
| `groupId` | `GroupChatId` | `GroupIdSchema` | All `groups.*` methods |
| `communityId` | `GroupChatId` | `GroupIdSchema` | All `communities.*` methods |
| `messageId` | `MessageId` | `MessageIdSchema` | `deleteMessage`, `react`, `starMessage`, etc. |
| `messageIds` | `MessageId[]` | `z.array(MessageIdSchema)` | `forwardMessages`, `deleteMessages` |
| `content` | `Content` | `z.string().min(1)` | `sendText`, `sendTextWithMentions` |
| `imgData` / `file` | `AdvancedFile` | `FileToDataUrlSchema` | `sendImage`, `sendFile`, etc. |

> **Why `communityId` uses `GroupChatId`:** At the WhatsApp protocol level, communities ARE groups — they use the same `@g.us` JID format and the same internal structures. A separate `CommunityId` branded type would create **false type-safety**: you CAN pass a community ID to group methods and it works. The shared type reflects protocol reality.

### 15.5 Migration Path from V4 Branded Types

| V4 Mechanism | V5 Replacement | Status |
|---|---|---|
| `type ChatId = Brand<string, "ChatId">` | `z.codec()` output: `.brand('ChatId')` + `z.registry()` | ✅ Unified |
| `aliasExamples` in `build-postman.ts` | `parameterRegistry.get(schema).example` | ✅ Replaced |
| `fixId()` in `Client.ts pup()` | `z.codec()` decode function with output `.regex()` | ✅ Replaced + validated |
| `ts-morph` type extraction | `parameterRegistry.get(schema).brandedType` | ✅ Replaced |
| `zod-to-json-schema` | `z.toJSONSchema()` native | ✅ Replaced |
| `@asteasolutions/zod-to-openapi` | `z.toJSONSchema(schema, { target: 'openapi-3.0' })` | ⚠️ Evaluate |

---

## 16. Documentation Strategy

### 16.1 TypeDoc Auto-Generated Alias Documentation

Every method's TSDoc **MUST** list all aliases at the top. This is auto-generated from the alias metadata:

```typescript
/**
 * Retrieves all chats.
 * 
 * @aliases listChats, chats.getAll, chats.list, chats.all
 * @namespace chats
 * @httpRoute GET /api/chats/getAll
 * 
 * @param withNewMessagesOnly - Only chats with unread messages
 * @returns Array of chat objects
 */
public getAllChats = implementMethod(Methods.getAllChats);

/**
 * Alias of {@link getAllChats}.
 * @see getAllChats
 */
public listChats = this.getAllChats;

/**
 * @deprecated Use {@link blockContact} instead.
 * Deprecated alias of {@link blockContact}.
 * @see blockContact
 */
public contactBlock = this.blockContact;
```

### 16.2 Root Method Hover Experience

When a user hovers over any method in their IDE, they should see:

- **Root method:** "Retrieves all chats. Aliases: listChats, chats.getAll, chats.list"
- **Alias:** "Alias of getAllChats."
- **Deprecated alias:** "⚠️ Deprecated. Use blockContact instead."

This eliminates the "what's the difference?" confusion.

---

## 17. Summary

The v5 schema system achieves **"best of all worlds"**:

- **v4 users**: zero breaking changes. All old method names, param names, and positional orders work as aliases.
- **New users from other WA libraries**: familiar names via explicit aliases (`sendVoiceNote`, `listChats`)
- **Maintainers**: methods organized by namespace in source; structured alias metadata auto-generates 80% of aliases
- **API consumers**: both flat REST endpoints and namespaced endpoints generated from one definition; HTTP aliases 308-redirect with `X-OpenWA-Aliases` header
- **Input safety**: Zod codecs normalize AND validate IDs — malformed parameters are rejected before reaching the WA session
- **Branded types**: V4's compile-time-only branded types are promoted to runtime Zod 4 codecs with `.brand()` + `z.registry()` + `.regex()` validation
- **Documentation**: Auto-generated TypeDoc/JSDoc with cross-referenced aliases eliminates confusion
- **Infrastructure**: Native Zod 4 features (`z.codec`, `z.registry`, `.meta()`, `z.toJSONSchema()`) replace all custom infrastructure (`WeakMap`, `createZodCodec`, `zod-to-json-schema`)
- **Future (v6)**: clean cut — remove deprecated aliases, keep only canonical names
