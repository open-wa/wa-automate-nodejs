import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { describeType, namedSchemas, namedTypeOf, typeLinks } from './type-documentation';
import { getHttpMethodDefinitions, type HttpMethodDefinition } from '../src/http-manifest';
import { clientRegistry, getParameterMetadata, type MethodDefinition, type ParameterMetadata } from '../src/registry';
import { eventRegistry, type EventDefinition } from '../src/events/registry';

import '../src/methods';
import '../src/events';

type JsonSchema = {
  type?: string | string[];
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  enum?: Array<string | number | boolean | null>;
  const?: string | number | boolean | null;
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  additionalProperties?: boolean | JsonSchema;
  examples?: unknown[];
};

type ParameterRow = {
  name: string;
  type: string;
  required: boolean;
  description: string;
  /** The description as sentences, without the branded type and pattern notes. */
  summary: string;
  aliases: string[];
  deprecatedAliases: string[];
  example: string;
  namedType?: string;
  /** A documented type name such as `MediaSendOptions`, when the parameter has one. */
  typeName?: string;
};

type CanonicalMethodRecord = {
  id: string;
  anchor: string;
  name: string;
  namespacedName: string;
  namespace: string;
  /** The method's section on its namespace page. */
  href: string;
  description: string;
  license: string | null;
  aliases: string[];
  deprecatedAliases: string[];
  parameterOrder: string[];
  parameters: ParameterRow[];
  returnType: string;
  returnTypeLinks: Record<string, string>;
  sdkReturnType: string | null;
  returnCaveat?: string;
  returnNotes: string;
  route: { method: string; path: string; flatPath: string } | null;
  examples: {
    inProcessSdk: string;
    nodeCall: string;
    nodeClient: string;
    http: string;
    response: string;
  };
};

const generatorPath = 'packages/schema/scripts/gen-client-reference-docs.ts';
const docsDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../apps/docs/content/docs/reference/client');
const referenceMetaPath = path.resolve(docsDir, '../meta.json');

// ── Reading order ───────────────────────────────────────────────────────────
// Developers scan a namespace page from the top, so pages and the methods on
// them follow how often a method is used, not the alphabet. Keep these lists in
// step with the registry: the generator fails on a name it can't find and warns
// about registered methods that aren't listed (they're appended alphabetically).

/** Namespace pages in the sidebar, most used first. */
const NAMESPACE_ORDER = [
  'messages',
  'chats',
  'contacts',
  'groups',
  'media',
  'session',
  'status',
  'labels',
  'communities',
  'calls',
  'business',
  'events',
  'mystatus',
  'chatIds',
] as const;

/** Page title and the job each namespace page covers. */
const NAMESPACE_PAGES: Record<string, { title: string; description: string }> = {
  messages: { title: 'Messages', description: 'Send, reply to, edit, delete and react to messages, and read message history.' },
  chats: { title: 'Chats', description: 'List chats, mark them read or unread, and archive, pin, mute or clear them.' },
  contacts: { title: 'Contacts', description: 'Check whether a number is on WhatsApp, look up contacts and profile pictures, and block or unblock people.' },
  groups: { title: 'Groups', description: 'Create groups, manage members and admins, share invite links and change group settings.' },
  // "Media" alone is the media guide's title; this page lists the methods.
  media: { title: 'Media methods', description: 'Download and decrypt images, video, audio and documents from messages you receive.' },
  session: { title: 'Session', description: 'Check the connection, read details about the logged-in account, and change its name, about text and picture.' },
  status: { title: 'Status updates', description: 'Post text, image and video status updates, read stories and delete your updates.' },
  labels: { title: 'Labels', description: 'Read WhatsApp Business labels and add them to or remove them from chats.' },
  communities: { title: 'Communities', description: 'List communities and read their details, members and admins.' },
  calls: { title: 'Calls', description: 'Start, answer, reject and end calls, and work with call audio.' },
  business: { title: 'Business', description: 'Read business profiles, product catalogues and orders.' },
  events: { title: 'Calendar events', description: 'Create, edit and cancel WhatsApp events, and read and send RSVPs.' },
  mystatus: { title: 'Contact status', description: 'Read the about text a contact has set.' },
  chatIds: { title: 'Chat IDs', description: 'List the IDs of every chat in the session.' },
};

/** Methods inside each namespace page, most used first. */
const METHOD_ORDER: Record<string, readonly string[]> = {
  messages: [
    'sendText', 'sendImage', 'sendFile', 'sendFileFromUrl', 'sendReplyWithMentions', 'react', 'sendTextWithMentions',
    'editMessage', 'deleteMessage', 'forwardMessages', 'sendSeen', 'getMessageById', 'sendAudio', 'sendPtt',
    'sendSticker', 'sendSoundSticker', 'sendAlbum', 'sendVideoAsGif', 'sendLocation', 'sendContact', 'sendVCard', 'sendMultipleContacts',
    'sendLinkWithAutoPreview', 'sendYouTubeLink', 'sendMessageWithThumb', 'sendPoll', 'getPollResults', 'voteOnPoll',
    'sendButtons', 'sendListMessage', 'sendInteractive', 'sendAdvancedButtons', 'sendBanner', 'getAllMessages',
    'loadEarlierMessages', 'getMyLastMessage', 'getMessageInfo', 'getMessagesForLLM', 'getAlbumMessages',
    'getUnsentMessages', 'getVCards', 'starMessage', 'unstarMessage', 'getStarredMessages', 'pinMessage',
    'unpinMessage', 'sendPaymentRequest', 'sendRawMessage',
  ],
  chats: [
    'getAllChats', 'getChat', 'markAsRead', 'markAsUnread', 'archiveChat', 'unarchiveChat', 'pinChat', 'unpinChat',
    'muteChat', 'unmuteChat', 'clearChat', 'deleteChat', 'isChatOnline', 'setChatEphemeral', 'getChatWithNonContacts',
  ],
  contacts: [
    'checkNumberStatus', 'getContact', 'getAllContacts', 'getProfilePicture', 'getNumberProfile', 'blockContact',
    'unblockContact', 'getBlockedIds', 'getCommonGroups', 'checkReadReceipts', 'requestPhoneNumber', 'sharePhoneNumber',
  ],
  groups: [
    'createGroup', 'getAllGroups', 'getGroupInfo', 'getGroupMembers', 'getGroupMembersId', 'getGroupAdmins',
    'addParticipant', 'removeParticipant', 'promoteParticipant', 'demoteParticipant', 'getGroupInviteLink',
    'revokeGroupInviteLink', 'joinGroupViaLink', 'leaveGroup', 'setGroupTitle', 'setGroupDescription', 'setGroupIcon',
    'setGroupToAdminsOnly', 'setGroupEditToAdminsOnly', 'approveGroupJoinRequest', 'rejectGroupJoinRequest',
    'getKickedGroups',
  ],
  media: ['decryptMedia', 'downloadMedia'],
  session: [
    'getConnectionState', 'healthCheck', 'getMe', 'getHostNumber', 'isPlugged', 'getBatteryLevel', 'getWAVersion',
    'getSnapshot', 'setMyName', 'setMyStatus', 'setProfilePicture', 'getLicenseType', 'getLicenseFeatures',
    'getFeatures', 'getLoadedMessageCount', 'getUserAgent', 'getProcessStats',
  ],
  status: ['postTextStatus', 'postImageStatus', 'postVideoStatus', 'getStories', 'deleteStatus', 'deleteAllStatus'],
  labels: ['getAllLabels', 'addLabel', 'removeLabel', 'getChatsByLabel'],
  communities: [
    'getAllCommunities', 'getCommunityInfo', 'getCommunityParticipants', 'getCommunityParticipantIds',
    'getCommunityAdmins', 'getCommunityAdminIds',
  ],
  calls: [
    'getCallCapabilities', 'startCall', 'acceptCall', 'rejectCall', 'endCall', 'muteCall', 'getActiveCall',
    'setCallMedia', 'observeCallAudio', 'stopCallAudioObserver', 'clearCallAudio',
  ],
  business: ['getBusinessProfile', 'getBusinessProducts', 'getOrder'],
  events: ['sendEvent', 'getEvents', 'getEvent', 'getEventResponses', 'respondToEvent', 'editEvent', 'cancelEvent'],
  mystatus: ['getStatus'],
  chatIds: ['getAllChatIds'],
};

/** Hand-written reference pages, in sidebar order, around the generated ones. */
const STARTUP_AND_EVENT_PAGES = ['create', 'core', 'client/events', 'events', 'event-contracts', 'hyperemitter'];
const TYPE_PAGES = ['client/return-types', 'client/schemas', 'messaging', 'client/licensed-methods', 'client/client'];
const recordsPath = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../apps/docs/src/generated/client-methods.json');

// The in-process Client facade can normalize the raw registry result. Read its
// public declarations so the UI does not silently apply one contract to both.
const sdkReturnTypes = new Map<string, string>();
const sdkMethodsDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../client/src/methods');
for (const file of fs.readdirSync(sdkMethodsDir).filter((file) => file.endsWith('.ts'))) {
  const text = fs.readFileSync(path.join(sdkMethodsDir, file), 'utf8');
  const start = text.indexOf('export interface ');
  const end = text.indexOf('\nexport function ', start);
  for (const match of text.slice(start, end).matchAll(/^\s*(\w+)\([^\n]*\):\s*Promise<(.+)>;/gm)) {
    sdkReturnTypes.set(match[1], match[2]);
  }
}
// Calling controls and licence introspection are declared directly on Client.
// Include those public declarations as well as the method-module interfaces.
const sdkClientPath = path.resolve(sdkMethodsDir, '../Client.ts');
for (const match of fs.readFileSync(sdkClientPath, 'utf8').matchAll(/^ {2}(?:async )?(\w+)\([^\n]*\):\s*Promise<(.+?)>\s*\{/gm)) {
  sdkReturnTypes.set(match[1], match[2].replace(/import\(['"][^'"]+['"]\)\./g, ''));
}
const sdkAliases: Record<string, string> = { isPlugged: 'getIsPlugged', getLoadedMessageCount: 'getAmountOfLoadedMessages', getProfilePicture: 'getProfilePic' };

function sortStrings(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function schemaToJsonSchema(schema: z.ZodTypeAny): JsonSchema {
  const serializableSchema = schema as z.ZodTypeAny & {
    toJSONSchema?: (params?: { target?: string; io?: 'input' | 'output'; unrepresentable?: 'any' }) => unknown;
  };

  if (typeof serializableSchema.toJSONSchema !== 'function') {
    return {};
  }

  return serializableSchema.toJSONSchema({ target: 'openapi-3.0', io: 'input', unrepresentable: 'any' }) as JsonSchema;
}

function getInputShape(def: MethodDefinition): Record<string, z.ZodTypeAny> {
  return def.meta.inputSchema.shape as Record<string, z.ZodTypeAny>;
}

function stringifyExample(value: unknown): string {
  if (value === undefined) {
    return '-';
  }

  return `\`${escapeMarkdownInline(JSON.stringify(value))}\``;
}

function escapeMarkdownInline(value: string): string {
  return value.replace(/`/g, '\\`').replace(/\|/g, '\\|');
}

function escapeTableCell(value: string): string {
  return escapeMarkdownInline(value.replace(/\n/g, ' '));
}

function escapeMdxText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.map((value) => `\`${escapeMarkdownInline(value)}\``).join(', ') : '-';
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function summarizeSchema(schema: JsonSchema): string {
  if (schema.const !== undefined) {
    return JSON.stringify(schema.const);
  }

  if (schema.enum && schema.enum.length > 0) {
    return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
  }

  const compound = schema.anyOf ?? schema.oneOf;
  if (compound && compound.length > 0) {
    const parts = uniqueStrings(compound.map(summarizeSchema));
    // `any` absorbs the union — an unstructured branch makes the whole thing any.
    if (parts.includes('any')) return 'any';
    return parts.join(' | ');
  }

  if (schema.allOf && schema.allOf.length > 0) {
    return uniqueStrings(schema.allOf.map(summarizeSchema)).join(' & ');
  }

  if (Array.isArray(schema.type)) {
    return schema.type.join(' | ');
  }

  if (schema.type === 'array') {
    const item = schema.items ? summarizeSchema(schema.items) : 'any';
    return `${item.includes(' | ') ? `(${item})` : item}[]`;
  }

  if (schema.type === 'object') {
    const propertyNames = schema.properties ? Object.keys(schema.properties) : [];
    if (propertyNames.length === 0) {
      return 'object';
    }

    const required = new Set(schema.required ?? []);
    return `{ ${sortStrings(propertyNames).map((name) => `${name}${required.has(name) ? '' : '?'}: ${summarizeSchema(schema.properties![name])}`).join('; ')} }`;
  }

  if (schema.type === 'integer') return 'number';

  return (schema.type as string) ?? 'any';
}

/**
 * Introspect a Zod schema directly as a fallback when JSON-schema summarization
 * yields `unknown` (e.g. `z.any()`, branded/piped types some targets don't
 * serialize). Returns `any` for genuinely-unstructured schemas.
 */
function summarizeZodType(schema: z.ZodTypeAny, depth = 0): string {
  if (depth > 6 || !schema) return 'any';
  const def = ((schema as { def?: unknown; _def?: unknown }).def ??
    (schema as { _def?: unknown })._def) as
    | { type?: string; options?: z.ZodTypeAny[]; element?: z.ZodTypeAny; innerType?: z.ZodTypeAny; in?: z.ZodTypeAny; shape?: Record<string, z.ZodTypeAny>; values?: unknown[] }
    | undefined;
  const type = def?.type;

  switch (type) {
    case 'any':
      return 'any';
    case 'unknown':
      return 'unknown';
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'undefined':
      return type;
    case 'union':
      return uniqueStrings((def?.options ?? []).map((o) => summarizeZodType(o, depth + 1))).join(' | ') || 'any';
    case 'array':
      return `${def?.element ? summarizeZodType(def.element, depth + 1) : 'any'}[]`;
    case 'object': {
      const keys = def?.shape ? sortStrings(Object.keys(def.shape)) : [];
      return keys.length ? `object { ${keys.join(', ')} }` : 'object';
    }
    case 'optional':
    case 'nullable':
    case 'default':
    case 'brand':
    case 'readonly':
      return def?.innerType ? summarizeZodType(def.innerType, depth + 1) : 'any';
    case 'pipe':
      return def?.in ? summarizeZodType(def.in, depth + 1) : 'unknown';
    case 'custom':
      return schema._zod.bag.Class === Buffer ? 'Buffer' : 'unknown';
    case 'enum':
      return (def?.values ?? []).map((v) => JSON.stringify(v)).join(' | ') || 'string';
    default:
      return 'any';
  }
}

/** Best-effort output type summary: JSON-schema first, Zod introspection fallback. */
function summarizeOutput(schema: z.ZodTypeAny): string {
  const inspect = (item: z.ZodTypeAny): void => {
    const def = item._zod.def as any;
    if (def.type === 'any') throw new Error('Method output uses any; supply its contract or explicitly document an unknown provider payload.');
    if (def.element) inspect(def.element);
    if (def.innerType) inspect(def.innerType);
    if (def.options) def.options.forEach(inspect);
  };
  inspect(schema);
  return describeType(schema);
}

function isUnstructuredOutput(summary: string): boolean {
  return summary === 'any' || summary === 'any[]';
}

function buildParameterRows(def: MethodDefinition): ParameterRow[] {
  const inputSchema = schemaToJsonSchema(def.meta.inputSchema);
  const properties = inputSchema.properties ?? {};
  const required = new Set(inputSchema.required ?? []);
  const inputShape = getInputShape(def);
  const orderedNames = uniqueStrings([
    ...def.meta.parameterOrder,
    ...sortStrings(Object.keys(properties).filter((name) => !def.meta.parameterOrder.includes(name))),
  ]);

  return orderedNames.map((name) => {
    const property = properties[name] ?? {};
    const metadata = inputShape[name] ? getParameterMetadata(inputShape[name]) : undefined;
    const descriptionParts = uniqueStrings([
      property.description,
      metadata?.formatDescription,
      metadata?.brandedType ? `Branded type: ${metadata.brandedType}` : undefined,
      metadata?.pattern ? `Pattern: ${metadata.pattern}` : property.pattern ? `Pattern: ${property.pattern}` : undefined,
    ]);

    return {
      name,
      type: summarizeSchema(property) === 'any' && inputShape[name]
        ? summarizeZodType(inputShape[name])
        : summarizeSchema(property),
      required: inputShape[name] ? !inputShape[name].isOptional() : required.has(name),
      description: descriptionParts.join(' '),
      summary: asSentences(uniqueStrings([property.description, metadata?.formatDescription])),
      aliases: sortStrings(metadata?.keyAliases ?? []),
      deprecatedAliases: sortStrings(metadata?.deprecatedKeyAliases ?? []),
      example: stringifyExample(metadata?.example ?? property.examples?.[0]),
      namedType: metadata?.brandedType,
      typeName: inputShape[name] ? namedTypeOf(inputShape[name]) : undefined,
    };
  });
}
function buildFrontmatter(title: string, description: string, icon?: string, seoTitle?: string): string {
  const lines = [
    '---',
    `title: ${JSON.stringify(title)}`,
    ...(seoTitle ? [`seoTitle: ${JSON.stringify(seoTitle)}`] : []),
    `description: ${JSON.stringify(description)}`,
  ];

  if (icon) {
    lines.push(`icon: ${JSON.stringify(icon)}`);
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * A fenced code block inside `<ReferenceCode>`, which serves it as plain text
 * and highlights it near the viewport. The Markdown copy keeps the fence.
 */
function referenceCode(lang: string, code: string): string {
  return ['<ReferenceCode>', '', `\`\`\`${lang}`, code, '```', '', '</ReferenceCode>'].join('\n');
}

/** Join description fragments into sentences: "Recipient chat ID. The target chat for a send operation." */
function asSentences(parts: string[]): string {
  return parts.map((part) => part.trim()).filter(Boolean).map((part) => /[.!?)]$/.test(part) ? part : `${part}.`).join(' ');
}

/** Prose for a Markdown table cell: pipes escaped, and MDX expression and tag characters encoded. */
function escapeProseCell(value: string): string {
  return value.replace(/\n/g, ' ').replace(/\|/g, '\\|').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * A type as inline code. A documented type links to its section on Return types,
 * which keeps the full declaration, instead of being expanded on every method.
 */
function linkedType(type: string): string {
  const code = `\`${escapeTableCell(type)}\``;
  const links = Object.entries(typeLinks(type));
  if (links.length === 1 && (type === links[0][0] || type === `${links[0][0]}[]`)) return `[${code}](${links[0][1]})`;
  return links.length > 0 ? `${code} (${links.map(([name, url]) => `[${name}](${url})`).join(', ')})` : code;
}

function parameterType(row: ParameterRow): string {
  return row.typeName ?? row.type;
}

/** Parameters as a plain table, so every name, type and description is in the page HTML. */
function buildParameterTable(rows: ParameterRow[]): string {
  if (rows.length === 0) {
    return 'This method takes no parameters.';
  }

  return [
    '| Parameter | Type | Description |',
    '| --- | --- | --- |',
    ...rows.map((row) => {
      const aliases = row.aliases.length > 0 ? ` Also accepts ${row.aliases.map((alias) => `\`${alias}\``).join(', ')}.` : '';
      const description = `${row.required ? '' : 'Optional. '}${escapeProseCell(row.summary)}${aliases}`.trim();
      return `| \`${row.name}\` | ${linkedType(parameterType(row))} | ${description || '-'} |`;
    }),
  ].join('\n');
}

/** HTTP routes and the method's other names in one line; Aliases has the full map. */
function buildRoutesLine(def: MethodDefinition, route: HttpMethodDefinition | undefined): string {
  const deprecatedNames = new Set(def.meta.deprecatedAliases ?? []);
  const otherNames = sortStrings((def.meta.allAliases ?? []).filter((alias) => alias !== def.meta.functionName && !deprecatedNames.has(alias)));
  const code = (value: string) => `\`${value}\``;
  const parts: string[] = [];
  if (route) {
    const aliasRoutes = route.aliasRoutes
      .filter((aliasRoute) => aliasRoute.path !== route.path)
      .sort((left, right) => left.path.localeCompare(right.path));
    const active = aliasRoutes.filter((aliasRoute) => !aliasRoute.deprecated).map((aliasRoute) => code(aliasRoute.path));
    const deprecated = aliasRoutes.filter((aliasRoute) => aliasRoute.deprecated).map((aliasRoute) => code(aliasRoute.path));
    parts.push(`**HTTP:** ${code(`${route.httpMethod} ${route.path}`)}${active.length > 0 ? `, or ${active.join(', ')}` : ''}.`);
    if (deprecated.length > 0) parts.push(`Deprecated routes: ${deprecated.join(', ')}.`);
  } else {
    parts.push('**HTTP:** none. Call this method from the SDK or SocketClient.');
  }
  if (otherNames.length > 0) parts.push(`**Also named:** ${otherNames.map(code).join(', ')}.`);
  if (deprecatedNames.size > 0) parts.push(`Deprecated names: ${sortStrings([...deprecatedNames]).map(code).join(', ')}.`);
  return parts.join(' ');
}

/** Return types longer than this go in a code block instead of a sentence. */
const MAX_INLINE_RETURN_TYPE = 72;

/** Returns reads as a sentence; only long object types get a code block. */
function buildReturnsBlock(record: CanonicalMethodRecord): string {
  const type = record.returnType;
  const lines: string[] = [];
  const links = Object.entries(typeLinks(type));
  const fieldsSentence = links.length > 0
    ? ` See ${links.map(([name, url]) => `[${name}](${url})`).join(' and ')} for ${links.length > 1 ? 'their' : 'its'} fields.`
    : '';
  if (links.length === 1 && links[0][0] === type) {
    lines.push(`Resolves to [\`${type}\`](${links[0][1]}).`);
  } else if (type.length <= MAX_INLINE_RETURN_TYPE) {
    lines.push(`Resolves to \`${type}\`.${fieldsSentence}`);
  } else {
    const arms = splitTopLevelUnion(type);
    lines.push('Resolves to:', '', referenceCode('ts', arms.length > 1 ? arms.map((arm) => `| ${arm}`).join('\n') : type));
    if (fieldsSentence) lines.push('', fieldsSentence.trim());
  }
  if (isUnstructuredOutput(type)) {
    lines.push('', 'WhatsApp decides the shape of this data and it can change, so check fields before you rely on them.');
  }

  const notes = record.returnNotes || record.returnCaveat;
  if (notes) lines.push('', notes);

  if (!record.sdkReturnType) {
    lines.push('', "The SDK `Client` doesn't have this method. Call it through SocketClient or HTTP.");
  } else if (record.sdkReturnType !== type) {
    lines.push('', `The SDK resolves to \`${record.sdkReturnType}\` instead.`);
  }

  return lines.join('\n');
}

/** Guidance about the result beyond its type. Empty when the type says it all. */
function buildReturnNotes(def: MethodDefinition): string {
  if (def.meta.functionName === 'sendText') {
    return "The ID means WhatsApp accepted the message, not that it was delivered or read. On failure the SDK throws `SendTextError`, exported by `@open-wa/wa-automate`. Its `code` is `INVALID_ARGUMENT`, `LICENSE_REQUIRED`, `SEND_REJECTED`, `INVALID_SEND_RESULT` or `SEND_FAILED`, and its `outcome` is `not_sent` or `unknown`. An `unknown` outcome means the message may already have been sent, so check the chat before you retry. The client never retries on its own.";
  }

  if (def.meta.functionName === 'deleteMessage') {
    return "`true` means the delete was accepted and `false` means it didn't complete. WhatsApp can still refuse to remove the message for everyone, so `true` doesn't prove every recipient lost it.";
  }

  return def.meta.outputSchema.description ?? '';
}

/** Illustrative JSON data follows the output schema, never a guessed ID for every object. */
function responseValue(schema: z.ZodType, depth = 0): unknown {
  if (depth > 8) return undefined;
  const def = schema._zod.def as any;
  const name = describeType(schema);
  if (name === 'AlbumSendResult') return {
    albumId: 'true_447123456789@c.us_ALBUM123',
    messageIds: ['true_447123456789@c.us_PHOTO1', 'true_447123456789@c.us_PHOTO2',
      'true_447123456789@c.us_PHOTO3', 'true_447123456789@c.us_PHOTO4'],
  };
  if (name === 'DataURL') return 'data:image/png;base64,...';
  if (/^(ChatId|ContactId)$/.test(name)) return '447123456789@c.us';
  if (/^(GroupId|GroupChatId)$/.test(name)) return '447123456789-1445627445@g.us';
  if (name === 'MessageId') return 'true_447123456789@c.us_9C4D0965EA5C09D591334AB6BDB07FEB';
  switch (def.type) {
    case 'array': return [];
    case 'boolean': return true;
    case 'number': return 0;
    case 'string': return 'example';
    case 'literal': return [...def.values][0];
    case 'enum': return Object.values(def.entries)[0];
    case 'union': return responseValue(def.options[0], depth + 1);
    case 'pipe': return responseValue(def.out, depth + 1);
    case 'optional': case 'nullable': case 'default': case 'readonly': return responseValue(def.innerType, depth + 1);
    case 'object': return Object.fromEntries(Object.entries(def.shape).filter(([, value]) => !(value as z.ZodType).isOptional()).map(([key, value]) => [key, responseValue(value as z.ZodType, depth + 1)]));
    case 'record': return {};
    default: return undefined;
  }
}
function buildResponseExample(schema: z.ZodType): string {
  return JSON.stringify({ success: true, data: responseValue(schema) }, null, 2);
}

function decodeMarkdownInline(value: string): string {
  return value.replace(/^`|`$/g, '').replace(/\\`/g, '`').replace(/\\\|/g, '|').replace(/&#123;/g, '{').replace(/&#125;/g, '}');
}

function sampleValueForParameter(row: ParameterRow): string {
  if (row.example !== '-') {
    const example = decodeMarkdownInline(row.example);
    return row.type.endsWith('[]') && !row.type.includes(' | ') && !example.startsWith('[') ? `[${example}]` : example;
  }

  if (row.name === 'options' && row.description.includes('Poll')) return '[\"Yes\", \"No\"]';
  if (row.type.startsWith('{') || row.type.startsWith('object') || row.type === 'unknown' || row.type === 'any') return '{}';
  if (row.type === 'string | string[]' && row.name === 'contactId') return JSON.stringify('447123456789@c.us');
  if (row.type.endsWith('[]')) return '[]';

  if (row.type.includes('number')) {
    return '1';
  }

  if (row.type.includes('boolean')) {
    return 'true';
  }

  if (row.type.startsWith('object') || row.type === 'unknown') {
    return '{}';
  }

  return JSON.stringify(row.name);
}

/** Samples wrap once a line would scroll on a laptop-width code block. */
const MAX_SAMPLE_LINE = 80;

/** Pretty-print a long JSON sample so objects and arrays wrap instead of scrolling. */
function formatSampleValue(sample: string, indent: string): string {
  if (sample.length <= 40) return sample;
  try {
    const parsed = JSON.parse(sample);
    if (parsed === null || typeof parsed !== 'object') return sample;
    return JSON.stringify(parsed, null, 2).split('\n').map((line, index) => index === 0 ? line : `${indent}${line}`).join('\n');
  } catch {
    return sample;
  }
}

/** `prefix(a, b)` on one line when it fits, otherwise one argument per line. */
function formatCall(prefix: string, args: string[]): string {
  const oneLine = `${prefix}(${args.join(', ')});`;
  if (oneLine.length <= MAX_SAMPLE_LINE && !oneLine.includes('\n')) return oneLine;
  return `${prefix}(\n${args.map((arg) => `  ${formatSampleValue(arg, '  ')},`).join('\n')}\n);`;
}

function buildPositionalCall(functionName: string, rows: ParameterRow[]): string {
  if (functionName === 'sendAlbum') return `${buildAlbumMediaExample()}\n\n${formatCall('const result = await client.sendAlbum', ["'447123456789@c.us'", 'media', "'One caption for the album'"])}`;
  return formatCall(`const result = await client.${functionName}`, rows.map((row) => sampleValueForParameter(row)));
}

function buildObjectCall(functionName: string, rows: ParameterRow[]): string {
  if (functionName === 'sendAlbum') return `${buildAlbumMediaExample()}\n\nconst result = await client.sendAlbum({\n  to: '447123456789@c.us',\n  media,\n  caption: 'One caption for the album',\n});`;
  if (rows.length === 0) {
    return `const result = await client.${functionName}();`;
  }

  if (functionName === 'decryptMedia' || functionName === 'downloadMedia') {
    return `// Use the full media message received by your message handler.\nconst result = await client.${functionName}({ message${functionName === 'downloadMedia' ? ', path: \"./downloaded-media\"' : ''} });`;
  }
  const body = rows.map((row) => `  ${row.name}: ${formatSampleValue(sampleValueForParameter(row), '  ')},`).join('\n');
  return `const result = await client.${functionName}({\n${body}\n});`;
}

function buildAlbumMediaExample(): string {
  return [
    "import { readFile } from 'node:fs/promises';",
    '',
    '// Put these real image files in your process working directory.',
    "const media = await Promise.all(['photo-1.jpg', 'photo-2.jpg', 'photo-3.jpg', 'photo-4.jpg'].map(async filename => ({",
    '  filename,',
    "  file: `data:image/jpeg;base64,${(await readFile(filename)).toString('base64')}`,",
    '})));',
  ].join('\n');
}

function buildJsonBody(rows: ParameterRow[], indent: string): string {
  if (rows.length === 0) {
    return '{}';
  }

  const entries = rows.map((row) => {
    const sample = sampleValueForParameter(row);
    try {
      return [row.name, JSON.parse(sample)] as const;
    } catch {
      return [row.name, sample] as const;
    }
  });

  return JSON.stringify(Object.fromEntries(entries), null, 2).split('\n').map((line, index) => index === 0 ? line : `${indent}${line}`).join('\n');
}

function buildCurlExample(route: HttpMethodDefinition | undefined, rows: ParameterRow[]): string {
  if (!route) {
    return '# This method has no HTTP route. Call it from the SDK or SocketClient.';
  }

  const url = `http://localhost:8080${route.path}`;
  if (route.functionName === 'sendAlbum') {
    return `# Save an album request as album.json with "to", "caption", and "media".\n# Each media item needs "filename" and "file" containing a real image/video data URL.\n# See /docs/guides/messages#albums for encoding real files.\ncurl -X ${route.httpMethod} "${url}" \\\n  -H "content-type: application/json" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  --data-binary @album.json`;
  }
  if (rows.some((row) => row.name === 'message' && row.type.startsWith('{'))) {
    return `# Save the full incoming media message as the "message" field in request.json.\n# For downloadMedia, also set "path" to the destination filename.\ncurl -X ${route.httpMethod} "${url}" \\\n  -H "content-type: application/json" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  --data-binary @request.json`;
  }
  if (route.httpMethod === 'GET' && rows.length > 0) {
    return [
      `curl -G ${JSON.stringify(url)} \\`,
      '  -H "x-api-key: YOUR_API_KEY" \\',
      ...rows.map((row, index) => {
        const suffix = index === rows.length - 1 ? '' : ' \\';
        return `  --data-urlencode ${JSON.stringify(`${row.name}=${sampleValueForParameter(row).replace(/^"|"$/g, '')}`)}${suffix}`;
      }),
    ].join('\n');
  }

  return [
    `curl -X ${route.httpMethod} ${JSON.stringify(url)} \\`,
    '  -H "content-type: application/json" \\',
    '  -H "x-api-key: YOUR_API_KEY" \\',
    `  --data '${buildJsonBody(rows, '  ')}'`,
  ].join('\n');
}

/**
 * A sub-heading inside a method block. A literal `<h3>` stays out of the page's
 * table of contents, which lists method names only, and skips the copy-link
 * button a Markdown heading renders; with three per method that button alone
 * was a seventh of the Messages page. The id stays unique across the page.
 */
function methodSubheading(title: string, anchor: string): string {
  return `<h3 id="${anchor}-${title.toLowerCase()}" className="scroll-m-28">${title}</h3>`;
}

function buildUsageTabs(record: CanonicalMethodRecord): string {
  // The tab shown follows the reader's site-wide interface choice.
  return [
    methodSubheading('Usage', record.anchor),
    '',
    '<InterfaceTabs>',
    ...(record.sdkReturnType ? [
      '  <InterfaceTab value="SDK">',
      '',
      referenceCode('ts', record.examples.inProcessSdk),
      '',
      '  </InterfaceTab>',
    ] : []),
    '  <InterfaceTab value="SocketClient">',
    '',
    referenceCode('ts', record.examples.nodeClient),
    '',
    '  </InterfaceTab>',
    '  <InterfaceTab value="HTTP">',
    '',
    referenceCode('bash', record.examples.http),
    '',
    'Response:',
    '',
    referenceCode('json', record.examples.response),
    '',
    '  </InterfaceTab>',
    '</InterfaceTabs>',
  ].join('\n');
}

function methodAnchor(functionName: string): string {
  return functionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildCanonicalMethodRecord(
  def: MethodDefinition,
  route: HttpMethodDefinition | undefined,
): CanonicalMethodRecord {
  const parameters = buildParameterRows(def);
  const returnType = summarizeOutput(def.meta.outputSchema);
  const sdkReturnType = sdkReturnTypes.get(sdkAliases[def.meta.functionName] ?? def.meta.functionName) ?? null;
  const anchor = methodAnchor(def.meta.functionName);
  const exampleParameters = parameters.filter((parameter) => parameter.required);
  const exampleCall = def.meta.functionName === 'sendText'
    ? [
      `const messageId = await client.sendText(${sampleValueForParameter(parameters.find((parameter) => parameter.name === 'to')!)}, ${sampleValueForParameter(parameters.find((parameter) => parameter.name === 'content')!)});`,
      'console.log(\'Message ID:\', messageId);',
    ].join('\n')
    : buildObjectCall(def.meta.functionName, exampleParameters);

  return {
    id: `${slugForNamespace(def.meta.namespace ?? 'core')}.${anchor}`,
    anchor,
    name: def.meta.functionName,
    namespacedName: def.meta.namespace ? `${def.meta.namespace}.${def.meta.namespacedName}` : def.meta.functionName,
    namespace: def.meta.namespace ?? 'core',
    href: methodHref(def),
    description: def.meta.description ?? `Client method ${def.meta.functionName}.`,
    license: def.meta.license && def.meta.license !== 'none' ? def.meta.license : null,
    aliases: sortStrings(def.meta.allAliases ?? []),
    deprecatedAliases: sortStrings(def.meta.deprecatedAliases ?? []),
    parameterOrder: [...def.meta.parameterOrder],
    parameters,
    returnType,
    returnTypeLinks: typeLinks(`${returnType} ${sdkReturnType ?? ''}`),
    sdkReturnType,
    returnCaveat: def.meta.outputSchema.description ?? (def.meta.outputSchema._zod.def as any).element?.description,
    returnNotes: buildReturnNotes(def),
    route: route ? { method: route.httpMethod, path: route.path, flatPath: route.aliasRoutes.find((alias) => alias.name === def.meta.functionName)?.path ?? route.path } : null,
    examples: {
      inProcessSdk: !sdkReturnType ? '' : def.meta.functionName === 'decryptMedia' || def.meta.functionName === 'downloadMedia'
        ? `// Use the full media message from your message handler.\nconst result = await client.${def.meta.functionName}(message${def.meta.functionName === 'downloadMedia' ? ', "./downloaded-media"' : ''});`
        : def.meta.functionName === 'sendText'
          ? [
            "const messageId = await client.sendText('447123456789@c.us', 'Hello from open-wa');",
            "console.log('Message ID:', messageId);",
          ].join('\n')
          : buildPositionalCall(sdkAliases[def.meta.functionName] ?? def.meta.functionName, exampleParameters),
      nodeCall: exampleCall,
      nodeClient: [
        "import { SocketClient } from '@open-wa/socket-client';",
        '',
        "const client = await SocketClient.connect('http://localhost:8080', 'YOUR_API_KEY');",
        exampleCall,
      ].join('\n'),
      http: buildCurlExample(route, exampleParameters),
      response: buildResponseExample(def.meta.outputSchema),
    },
  };
}

/** Signatures stay on one line up to this width; code blocks fit about 90 characters. */
const MAX_SIGNATURE_LINE = 90;

/** Split a type on its top-level `|`, leaving unions inside objects alone. */
function splitTopLevelUnion(type: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < type.length; index += 1) {
    const char = type[index];
    if (char === '{' || char === '(' || char === '<' || char === '[') depth += 1;
    else if (char === '}' || char === ')' || char === '>' || char === ']') depth -= 1;
    else if (depth === 0 && type.startsWith(' | ', index)) {
      parts.push(type.slice(start, index));
      start = index + 3;
      index += 2;
    }
  }
  parts.push(type.slice(start));
  return parts;
}

/** Anonymous object types longer than this read as `{ … }` in a signature; the tables below spell them out. */
const MAX_SIGNATURE_OBJECT = 60;

function signatureType(type: string): string {
  return type.startsWith('{') && type.length > MAX_SIGNATURE_OBJECT ? '{ … }' : type;
}

/** The signature reads as code: one line when it fits, one parameter per line otherwise. */
function buildMethodSignature(record: CanonicalMethodRecord): string {
  const parameters = record.parameterOrder.map((name) => {
    const parameter = record.parameters.find((item) => item.name === name);
    return { label: `${name}${parameter?.required ? '' : '?'}`, type: signatureType(parameter ? parameterType(parameter) : 'unknown') };
  });
  const returnType = signatureType(record.returnType);
  const oneLine = `client.${record.name}(${parameters.map(({ label, type }) => `${label}: ${type}`).join(', ')}): Promise<${returnType}>`;
  if (oneLine.length <= MAX_SIGNATURE_LINE || parameters.length === 0) return oneLine;

  const lines = parameters.map(({ label, type }) => {
    const line = `  ${label}: ${type},`;
    const arms = splitTopLevelUnion(type);
    if (line.length <= MAX_SIGNATURE_LINE || arms.length < 2) return line;
    return [`  ${label}:`, ...arms.map((arm) => `    | ${arm}`)].join('\n') + ',';
  });
  return `client.${record.name}(\n${lines.join('\n')}\n): Promise<${returnType}>`;
}

function licenseSentence(tier: string): string {
  const label = tier === 'insiders' ? 'an Insiders' : `a ${titleCase(tier)}`;
  return `Needs ${label} license. See [pricing](/docs/licensing/pricing).`;
}

function buildMethodSection(def: MethodDefinition, route: HttpMethodDefinition | undefined): string {
  const record = buildCanonicalMethodRecord(def, route);

  const parts = [
    record.license ? `<span id="${record.anchor}---${record.license}" aria-hidden="true"></span>` : '',
    `## \`${def.meta.functionName}\``,
    '',
    record.description,
    '',
    def.meta.deprecated ? '**Deprecated.**' : '',
    '',
    record.license ? licenseSentence(record.license) : '',
    '',
    referenceCode('ts', buildMethodSignature(record)),
    '',
    def.meta.functionName === 'sendText'
      ? 'Leave out `options`: `sendText` ignores it, and neither the SDK nor HTTP needs it. For a quoted reply use `reply(to, content, messageId)`, and for mentions use `sendTextWithMentions`.'
      : '',
    '',
    buildUsageTabs(record),
    '',
    methodSubheading('Parameters', record.anchor),
    '',
    buildParameterTable(record.parameters),
    '',
    methodSubheading('Returns', record.anchor),
    '',
    buildReturnsBlock(record),
    '',
    buildRoutesLine(def, route),
  ];

  const section = parts.filter((part, index) => part !== '' || parts[index - 1] !== '').join('\n');
  if (!record.license) {
    return section;
  }

  // Keep the whole method contract inside the tier treatment. The blank lines
  // make headings, tables, and tabs parse as Markdown children of the MDX node.
  return [
    `<LicensedMethodSection tier="${record.license}">`,
    '',
    section,
    '',
    '</LicensedMethodSection>',
  ].join('\n');
}

function slugForNamespace(namespace: string): string {
  // Keep the registered listener reference at events.mdx.
  if (namespace === 'events') return 'whatsapp-events';
  return namespace.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

function buildGeneratedPage(title: string, description: string, body: string, seoTitle?: string): string {
  return [
    buildFrontmatter(title, description, 'BookOpen', seoTitle),
    '',
    `# ${title}`,
    '',
    body.trim(),
    '',
  ].join('\n');
}

/** The method's block on its namespace page. */
function methodHref(def: MethodDefinition): string {
  return `/docs/reference/client/${slugForNamespace(def.meta.namespace ?? 'core')}#${methodAnchor(def.meta.functionName)}`;
}

function namespaceTitle(namespace: string): string {
  return NAMESPACE_PAGES[namespace]?.title ?? titleCase(namespace);
}

// ── Every method on one page, A–Z: a lookup that links to the namespace pages ─
function buildClientIndexPage(methods: MethodDefinition[]): string {
  const rows = methods.map((def) => {
    const license = def.meta.license && def.meta.license !== 'none' ? titleCase(def.meta.license) : '-';
    return `| [\`${def.meta.functionName}\`](${methodHref(def)}) | ${escapeProseCell(namespaceTitle(def.meta.namespace ?? 'core'))} | ${escapeProseCell(asSentences([def.meta.description ?? '']))} | ${license} |`;
  });
  return buildGeneratedPage(
    'All methods (A–Z)',
    `All ${methods.length} open-wa methods in alphabetical order, each with a one-line summary and a link to its signature, examples, parameters and return type.`,
    [
      'Find a method by name or job, then open it on its page for the signature, an example, parameters and the return type.',
      '',
      // ClientReference filters the table rows in the browser; the table itself is plain Markdown.
      `<ClientReference total={${methods.length}}>`,
      '',
      '| Method | Page | What it does | License |',
      '| --- | --- | --- | --- |',
      ...rows,
      '',
      '</ClientReference>',
    ].join('\n'),
    'All open-wa WhatsApp API methods, A–Z | open-wa',
  );
}

// ── Methods grouped by license tier ─────────────────────────────────────────
function buildLicensedMethodsPage(methods: MethodDefinition[]): string {
  const byTier = new Map<string, MethodDefinition[]>();
  for (const def of methods) {
    const tier = def.meta.license && def.meta.license !== 'none' ? def.meta.license : 'none';
    (byTier.get(tier) ?? byTier.set(tier, []).get(tier)!).push(def);
  }
  const tierOrder = sortStrings([...byTier.keys()].filter((t) => t !== 'none'));

  const sections = tierOrder.map((tier) => {
    const list = (byTier.get(tier) ?? []).sort((a, b) => a.meta.functionName.localeCompare(b.meta.functionName));
    const rows = list.map((def) => {
      return `| [\`${def.meta.functionName}\`](${methodHref(def)}) | ${escapeTableCell(namespaceTitle(def.meta.namespace ?? 'core'))} | ${escapeTableCell(def.meta.description ?? '')} |`;
    });
    const section = [
      `## ${titleCase(tier)}`,
      '',
      '| Method | Page | Description |',
      '| --- | --- | --- |',
      ...rows,
    ].join('\n');
    return [
      `<LicensedMethodSection tier="${tier}">`,
      '',
      section,
      '',
      '</LicensedMethodSection>',
    ].join('\n');
  });

  return buildGeneratedPage(
    'Licensed methods',
    'Methods that need a license key, grouped by the tier that unlocks them.',
    [
      'These methods need a license key. Each table lists the methods one tier unlocks, and [pricing](/docs/licensing/pricing) shows what each tier costs.',
      '',
      sections.join('\n\n'),
    ].join('\n'),
  );
}

// ── #3 (#3338): contributor pages, registry-derived ─────────────────────────
function buildBaseClientMethodTable(methods: MethodDefinition[]): string {
  const rows = methods.map((def) => {
    const meta = def.meta;
    return `| \`${meta.functionName}\` | \`${escapeTableCell(meta.namespace ?? 'core')}\` | ${formatList(meta.parameterOrder)} | \`${escapeTableCell(summarizeOutput(meta.outputSchema))}\` |`;
  });
  return ['| Method | Namespace | Parameter order | Output |', '| --- | --- | --- | --- |', ...rows].join('\n');
}

function buildFunctionAliasTable(methods: MethodDefinition[]): string {
  const rows: string[] = [];
  for (const def of methods) {
    const deprecated = new Set(def.meta.deprecatedAliases ?? []);
    for (const alias of sortStrings(def.meta.allAliases ?? [])) {
      if (alias === def.meta.functionName) continue;
      rows.push(`| \`${def.meta.functionName}\` | \`${escapeTableCell(alias)}\` | ${deprecated.has(alias) ? 'Yes' : 'No'} | ${alias.includes('.') ? 'Namespaced' : 'Flat'} |`);
    }
  }
  return ['| Canonical method | Alias | Deprecated | Kind |', '| --- | --- | --- | --- |', ...rows].join('\n');
}

function buildKeyAliasTable(methods: MethodDefinition[]): string {
  const seen = new Set<string>();
  const rows: string[] = [];
  for (const def of methods) {
    for (const [name, schema] of Object.entries(getInputShape(def))) {
      const meta = getParameterMetadata(schema);
      for (const alias of sortStrings(meta?.keyAliases ?? [])) {
        const key = `${name}:${alias}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(`| \`${escapeTableCell(name)}\` | \`${escapeTableCell(alias)}\` | ${meta?.brandedType ? `\`${escapeTableCell(meta.brandedType)}\`` : '-'} | ${meta?.example !== undefined ? `\`${escapeMarkdownInline(JSON.stringify(meta.example))}\`` : '-'} |`);
      }
    }
  }
  return ['| Canonical key | Alias | Branded type | Example |', '| --- | --- | --- | --- |', ...sortStrings(rows)].join('\n');
}

function buildInternalsPages(
  methods: MethodDefinition[],
  namespaceCount: number,
  routes: Map<string, HttpMethodDefinition>,
): Record<string, string> {
  const methodCount = methods.length;
  const sendText = methods.find((d) => d.meta.functionName === 'sendText');

  return {
    'schema-pipeline': buildGeneratedPage('Schema pipeline', 'How method schemas become the client, types, OpenAPI, and these docs.', [
      'Every client method is defined once with `defineMethodV2()` and registered in `clientRegistry`. All downstream artifacts are projections of that single source of truth:',
      '',
      '```text',
      'packages/schema/src/methods/*.ts',
      '        |  defineMethodV2(...)',
      '        v',
      '  clientRegistry.getAll()',
      '        |',
      '        +-> gen-client-implementation.ts --> BaseClient / BaseNamespacedClient / AliasMap',
      '        +-> gen-types.ts                 --> generated Input/Output type aliases',
      '        +-> gen-openapi.ts               --> openapi.json',
      '        +-> gen-client-reference-docs.ts --> these reference pages',
      '```',
      '',
      `The registry currently holds **${methodCount} methods** across **${namespaceCount} namespaces**.`,
    ].join('\n')),

    'base-client': buildGeneratedPage('BaseClient', 'The generated flat client and the full method table.', [
      '`BaseClient` is generated from the registry. Each method is a one-line binding, for example:',
      '',
      '```ts',
      '/** Sends a text message to a chat */',
      'public sendText = implementMethod(Methods.sendText);',
      '```',
      '',
      'Each call maps its arguments, validates them with the method\'s Zod input schema and then runs the method in the session. See [Argument normalization](/docs/reference/client/argument-normalization).',
      '',
      '## Method table',
      '',
      buildBaseClientMethodTable(methods),
    ].join('\n')),

    'namespaced-client': buildGeneratedPage('Namespaced client', 'How BaseNamespacedClient builds namespace objects from aliases.', [
      'Namespaced aliases group related methods. For example, `groups.create` resolves to `createGroup`, and `messages.sendText` resolves to `sendText`. Both names identify the same registered method.',
      '',
      'The [A–Z method list](/docs/reference/client/client) uses flat method names. Each method on its namespace page lists its namespaced name and both HTTP routes.',
      '',
      'The [HTTP API](/docs/getting-started/easy-api) registers both forms, such as `/api/createGroup` and `/api/groups/create`. [SocketClient](/docs/guides/socket-client) and the [SDK](/docs/getting-started/custom-code) use flat calls such as `client.createGroup(...)`; they do not expose `client.groups.create(...)`, so their examples keep the callable form.',
      '',
      '`BaseNamespacedClient` is a generated base class for client implementations. It extends `BaseClient` and builds namespace objects from the registered aliases. It is not the class returned by `SocketClient.connect()`.',
      '',
      'See the full alias map on [Aliases](/docs/reference/client/aliases).',
    ].join('\n')),

    'argument-normalization': buildGeneratedPage('Argument normalization', 'Positional and object arguments, key aliases and validation.', [
      'Every generated method accepts either positional arguments (mapped by `parameterOrder`) or a single options object (with key aliases resolved).',
      '',
      '```ts',
      "await client.sendText('447123456789@c.us', 'Hello, world!');",
      '// positional args map by parameterOrder -> { to, content, options }',
      '',
      "await client.sendText({ chatId: '447123456789@c.us', text: 'Hello, world!' });",
      '// key aliases normalize -> { to, content }',
      '```',
      '',
      'Each call resolves positional or object arguments, normalizes key aliases, validates the result with `inputSchema.parseAsync()` and only then runs the method. Invalid input rejects before anything reaches WhatsApp.',
    ].join('\n')),

    aliases: buildGeneratedPage('Aliases', 'Function aliases and parameter key aliases across all methods.', [
      '## Function aliases',
      '',
      'Alternative names (including namespaced forms) that resolve to a canonical method.',
      '',
      buildFunctionAliasTable(methods),
      '',
      '## Parameter key aliases',
      '',
      'Alternative object keys accepted for a canonical parameter.',
      '',
      buildKeyAliasTable(methods),
    ].join('\n')),

    schemas: buildGeneratedPage('Data models', 'The message, contact, chat and group objects most methods return.', [
      'These are the objects most methods return. [Return types](/docs/reference/client/return-types) covers every other result.',
      '',
      '### Message',
      '<AutoTypeTable path="../../../../../../packages/schema/src/common-types.ts" name="Message" />',
      '',
      '### Contact',
      '<AutoTypeTable path="../../../../../../packages/schema/src/common-types.ts" name="Contact" />',
      '',
      '### Chat',
      '<AutoTypeTable path="../../../../../../packages/schema/src/common-types.ts" name="Chat" />',
      '',
      '### GroupMetadata',
      '<AutoTypeTable path="../../../../../../packages/schema/src/common-types.ts" name="GroupMetadata" />',
    ].join('\n')),

    'generated-types': buildGeneratedPage('Generated types', 'Where the generated input/output type aliases come from.', [
      '`gen-types.ts` emits input and output type aliases for every method from its `inputSchema` and `outputSchema` into `packages/schema/src/generated/types.ts`. `@open-wa/wa-automate-types-only` re-exposes this generated surface so consumers can import method types without the runtime.',
    ].join('\n')),

    'send-text-worked-example': buildGeneratedPage('Trace sendText', 'Follow sendText from its schema definition to the call in a session.', [
      sendText
        ? [
            'This walkthrough for contributors follows `sendText` from its schema definition to the call in a session. To use it, start with the [sendText reference](/docs/reference/client/messages#sendtext).',
            '',
            '## Consumer usage',
            '',
            '```ts',
            "import { create } from '@open-wa/wa-automate';",
            '',
            "const client = await create({ sessionId: 'docs-example' });",
            'try {',
            "  const messageId = await client.sendText('447123456789@c.us', 'Hello from open-wa');",
            "  console.log('Message ID:', messageId);",
            '} finally {',
            '  await client.stop();',
            '}',
            '```',
            '',
            '## Trace',
            '',
            '`sendText` is defined in `packages/schema/src/methods/messaging.ts`:',
            '',
            '```ts',
            "export const sendText = defineMethodV2('sendText', {",
            `  meta: { description: ${JSON.stringify(sendText.meta.description ?? '')}, namespace: ${JSON.stringify(sendText.meta.namespace ?? 'core')}, httpMethod: ${JSON.stringify((routes.get('sendText')?.httpMethod) ?? 'POST')} },`,
            `  parameterOrder: ${JSON.stringify(sendText.meta.parameterOrder)},`,
            '  // input: z.object({ to, content, options }), output: SendTextResultSchema',
            '});',
            '```',
            '',
            '1. A positional call maps by `parameterOrder`.',
            '2. An object call resolves key aliases (`chatId` → `to`, `text` → `content`).',
            '3. `inputSchema.parseAsync()` validates the arguments.',
            '4. The validated call runs in the session and resolves to the message ID.',
            '5. See the full reference on the [messages namespace page](/docs/reference/client/messages#sendtext).',
          ].join('\n')
        : 'The `sendText` method is not currently registered.',
    ].join('\n')),
  };
}

// ── #4: generated events reference from the event registry ──────────────────
function buildEventsPage(events: EventDefinition[]): string {
  const sorted = [...events].sort((a, b) => a.meta.eventName.localeCompare(b.meta.eventName));
  const rows = sorted.map((def) => {
    const m = def.meta;
    const payload = summarizeOutput(m.payloadSchema);
    const status = m.status ?? 'stable';
    const license = m.license && m.license !== 'none' ? `\`${m.license}\`` : '-';
    const eventAnchor = m.eventName.toLowerCase();
    return `| <span id="${eventAnchor}" className="scroll-m-28"></span>\`${escapeTableCell(m.eventName)}\` | \`${escapeTableCell(m.legacyName)}\` | ${escapeTableCell(m.description ?? '')} | \`${escapeTableCell(payload)}\` | ${status} | ${license} |`;
  });

  return buildGeneratedPage(
    'Event listeners',
    'Every event you can listen for, with its listener name and payload.',
    [
      'Subscribe with a client helper such as `client.onMessage`, the listener name in the second column, or the event bus wildcard.',
      '',
      '| Event | Legacy listener | Description | Payload | Status | License |',
      '| --- | --- | --- | --- | --- | --- |',
      ...rows,
    ].join('\n'),
  );
}

/** Contributor pages about how the reference is built, at the bottom of the sidebar. */
const INTERNALS_PAGE_ORDER = [
  'schema-pipeline',
  'base-client',
  'namespaced-client',
  'argument-normalization',
  'aliases',
  'generated-types',
  'send-text-worked-example',
];

function writeFileIfChanged(filePath: string, content: string): void {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf-8') === content) {
    return;
  }

  fs.writeFileSync(filePath, content);
}

function cleanGeneratedDocs(): void {
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    return;
  }

  for (const entry of fs.readdirSync(docsDir)) {
    if (entry.endsWith('.mdx') || entry === 'meta.json' || entry === 'methods-map.json' || entry === 'methods-records.json') {
      fs.rmSync(path.join(docsDir, entry));
    }
  }
}

/** Namespaces in reading order; any namespace missing from NAMESPACE_ORDER follows alphabetically. */
function orderNamespaces(registered: string[]): string[] {
  const known = NAMESPACE_ORDER.filter((namespace) => registered.includes(namespace));
  const unknown = sortStrings(registered.filter((namespace) => !(NAMESPACE_ORDER as readonly string[]).includes(namespace)));
  for (const namespace of unknown) {
    console.warn(`[reference] Namespace "${namespace}" isn't in NAMESPACE_ORDER; listing it after the others.`);
  }
  return [...known, ...unknown];
}

/** Methods in reading order; unlisted methods follow alphabetically. */
function orderMethods(namespace: string, defs: MethodDefinition[]): MethodDefinition[] {
  const order = METHOD_ORDER[namespace] ?? [];
  const byName = new Map(defs.map((def) => [def.meta.functionName, def]));
  for (const name of order) {
    if (!byName.has(name)) {
      throw new Error(`[reference] METHOD_ORDER.${namespace} lists "${name}", but no such method is registered in that namespace.`);
    }
  }
  const unlisted = defs.filter((def) => !order.includes(def.meta.functionName));
  for (const def of unlisted) {
    console.warn(`[reference] "${def.meta.functionName}" isn't in METHOD_ORDER.${namespace}; listing it after the others.`);
  }
  return [...order.map((name) => byName.get(name)!), ...unlisted];
}

const methods = clientRegistry
  .getAll()
  .slice()
  .sort((left, right) => left.meta.functionName.localeCompare(right.meta.functionName));
const routesByFunctionName = new Map(
  getHttpMethodDefinitions('/api')
    .slice()
    .sort((left, right) => left.functionName.localeCompare(right.functionName))
    .map((route) => [route.functionName, route])
);
const methodsByNamespace = new Map<string, MethodDefinition[]>();

for (const def of methods) {
  const namespace = def.meta.namespace ?? 'core';
  const namespaceMethods = methodsByNamespace.get(namespace) ?? [];
  namespaceMethods.push(def);
  methodsByNamespace.set(namespace, namespaceMethods);
}
for (const [namespace, defs] of methodsByNamespace) {
  methodsByNamespace.set(namespace, orderMethods(namespace, defs));
}

cleanGeneratedDocs();

const namespaces = orderNamespaces(Array.from(methodsByNamespace.keys()));

// The whole API reference sidebar: namespaces first, then startup and events,
// then types, with the pages about how the reference is built at the bottom.
const referenceMeta = {
  title: 'API reference',
  icon: 'FileCode',
  pages: [
    // /docs/reference stays reachable for old links but isn't a second landing page.
    '!index',
    'client/index',
    ...namespaces.map((namespace) => `client/${slugForNamespace(namespace)}`),
    '---Startup and events---',
    ...STARTUP_AND_EVENT_PAGES,
    '---Types---',
    ...TYPE_PAGES,
    '---How the reference is built---',
    ...INTERNALS_PAGE_ORDER.map((slug) => `client/${slug}`),
  ],
};

const indexContent = [
  buildFrontmatter(
    'Overview',
    'Every method open-wa offers, grouped by job, with SDK, SocketClient and HTTP examples.',
    'BookOpen',
    'WhatsApp API reference for Node.js and HTTP | open-wa',
  ),
  '',
  '# API reference',
  '',
  'Find the job you want to do, then the method that does it. Each method shows the same call from the SDK, from SocketClient and over HTTP.',
  '',
  '<InterfacePreference />',
  '',
  '## Methods by job',
  '',
  '<Cards>',
  '',
  ...namespaces.map((namespace) => {
    const page = NAMESPACE_PAGES[namespace];
    return [
      `  <Card title="${escapeMdxText(namespaceTitle(namespace))}" href="/docs/reference/client/${slugForNamespace(namespace)}">`,
      `    ${escapeMdxText(page?.description ?? '')}`,
      '  </Card>',
      '',
    ].join('\n');
  }),
  '</Cards>',
  '',
  '## Calling a method',
  '',
  '- **SDK:** start a session with `create()` from `@open-wa/wa-automate`, then call methods on the client it returns, for example `await client.sendText(to, content)`.',
  "- **SocketClient:** connect to a running Easy API with `SocketClient.connect('http://localhost:8080', 'YOUR_API_KEY')` and make the same calls over the network.",
  '- **HTTP:** send JSON to `POST /api/<page>/<method>`, such as `/api/messages/sendText`, with your key in the `x-api-key` header. Body keys match the parameter names on each method.',
  '',
  'Every method returns a promise that rejects when the arguments are invalid or the call fails. Over HTTP a successful call returns `{ "success": true, "data": … }`, where `data` is the value listed under **Returns**, and a failed call returns an error status with `{ "error", "details" }`.',
  '',
  '## Also in the reference',
  '',
  '- [All methods (A–Z)](/docs/reference/client/client) puts every method on one page with a filter.',
  '- [Licensed methods](/docs/reference/client/licensed-methods) lists the methods that need a license key.',
  '- [Event listeners](/docs/reference/client/events) lists every event you can subscribe to.',
  '- [Return types](/docs/reference/client/return-types) and [Data models](/docs/reference/client/schemas) describe the objects methods return.',
].join('\n');

writeFileIfChanged(path.join(docsDir, 'index.mdx'), `${indexContent}\n`);
writeFileIfChanged(referenceMetaPath, `${JSON.stringify(referenceMeta, null, 2)}\n`);

// Every method on one page, alphabetical; full detail lives on the namespace pages.
writeFileIfChanged(path.join(docsDir, 'client.mdx'), buildClientIndexPage(methods));

// #3 (#3338): registry-derived contributor pages.
const internalsPages = buildInternalsPages(methods, namespaces.length, routesByFunctionName);
for (const [slug, content] of Object.entries(internalsPages)) {
  writeFileIfChanged(path.join(docsDir, `${slug}.mdx`), content);
}

// #4: generated events reference.
writeFileIfChanged(path.join(docsDir, 'events.mdx'), buildEventsPage(eventRegistry.getAll()));

// #6: methods grouped by license tier.
writeFileIfChanged(path.join(docsDir, 'licensed-methods.mdx'), buildLicensedMethodsPage(methods));

for (const namespace of namespaces) {
  const namespaceMethods = methodsByNamespace.get(namespace) ?? [];
  const title = namespaceTitle(namespace);
  const description = NAMESPACE_PAGES[namespace]?.description ?? `Methods in the ${namespace} namespace.`;
  const pageContent = [
    buildFrontmatter(title, description, 'BookOpen'),
    '',
    // A relative import: MDX pages can't use the `@/` alias in the Vite build.
    "import { ReferenceCode } from '../../../../src/components/reference-code';",
    '',
    `# ${title}`,
    '',
    namespaceMethods.map((def) => buildMethodSection(def, routesByFunctionName.get(def.meta.functionName))).join('\n\n'),
  ].join('\n');

  writeFileIfChanged(path.join(docsDir, `${slugForNamespace(namespace)}.mdx`), `${pageContent}\n`);
}

const methodsMap: Record<string, string> = {};
const canonicalMethodRecords: CanonicalMethodRecord[] = [];
for (const def of methods) {
  const record = buildCanonicalMethodRecord(def, routesByFunctionName.get(def.meta.functionName));
  canonicalMethodRecords.push(record);
  methodsMap[def.meta.functionName] = methodHref(def);
}

writeFileIfChanged(path.join(docsDir, 'methods-map.json'), `${JSON.stringify(methodsMap, null, 2)}\n`);
writeFileIfChanged(recordsPath, `${JSON.stringify(canonicalMethodRecords, null, 2)}\n`);

console.log(`Successfully generated Client API reference docs: ${methods.length} methods across ${namespaces.length} namespaces, internals pages, licensed-methods page, flat index and methods map`);

/**
 * An earlier object type this one shares almost every field with, such as
 * Message for Story. Its table then lists only the fields that differ.
 */
function baseObjectType(name: string, shape: Record<string, z.ZodType>): { name: string; shape: Record<string, z.ZodType> } | undefined {
  const keys = Object.keys(shape);
  for (const [candidate, schema] of Object.entries(namedSchemas)) {
    if (candidate === name) return undefined;
    const def = schema._zod.def as any;
    if (def.type !== 'object') continue;
    const shared = keys.filter((key) => def.shape[key] === shape[key]).length;
    if (shared >= 8 && shared >= keys.length * 0.8 && shared >= Object.keys(def.shape).length * 0.8) return { name: candidate, shape: def.shape };
  }
  return undefined;
}

// Return types keeps every full declaration. An object's field table already
// carries its fields, types and links, so its declaration renders on request
// instead of repeating the table as highlighted code.
const modelPages = Object.entries(namedSchemas).map(([name, schema]) => {
  const def = schema._zod.def as any;
  const declaration = `type ${name} = ${describeType(schema, true)}`;
  const description = schema.description ?? z.toJSONSchema(schema, { unrepresentable: 'any' }).description ?? '';
  const lines = [`## ${name}`, '', description, ''];
  if (def.type === 'object') {
    const shape = def.shape as Record<string, z.ZodType>;
    const base = baseObjectType(name, shape);
    const fields = Object.entries(shape).filter(([field, value]) => !base || base.shape[field] !== value);
    if (base) {
      const missing = Object.keys(base.shape).filter((field) => !(field in shape));
      lines.push(
        `${name} has the same fields as [${base.name}](/docs/reference/client/return-types#${base.name.toLowerCase()}), apart from these.${missing.length > 0 ? ` It has no ${missing.map((field) => `\`${field}\``).join(', ')} field${missing.length > 1 ? 's' : ''}.` : ''}`,
        '',
      );
    }
    lines.push('| Field | Type | Required |', '| --- | --- | --- |');
    for (const [field, value] of fields) {
      const item = value as z.ZodType;
      const type = describeType(item).replace(/ \| undefined$/, '');
      const links = Object.entries(typeLinks(type)).filter(([n]) => n !== name).map(([n, url]) => `[${n}](${url})`).join(', ');
      lines.push(`| \`${field}\` | \`${escapeTableCell(type)}\`${links ? ` — ${links}` : ''} | ${item.isOptional() ? 'No' : 'Yes'} |`);
    }
    lines.push('', `<TypeDeclaration name=${JSON.stringify(name)} code={${JSON.stringify(declaration)}} />`, '');
  } else {
    const related = Object.entries(typeLinks(declaration)).filter(([n]) => n !== name).map(([n, url]) => `[${n}](${url})`).join(', ');
    lines.push(referenceCode('ts', declaration), '', related ? `Related types: ${related}` : '');
  }
  return lines.join('\n');
});
writeFileIfChanged(path.join(docsDir, 'return-types.mdx'), [
  buildFrontmatter('Return types', 'The named data shapes open-wa methods return, with their fields, types and full TypeScript declarations.', 'Braces'),
  '',
  // A relative import: MDX pages can't use the `@/` alias in the Vite build.
  "import { TypeDeclaration } from '../../../../src/components/type-declaration';",
  "import { ReferenceCode } from '../../../../src/components/reference-code';",
  '', '# Return types', '',
  'These are TypeScript data shapes, not class instances. Follow a type from a method to inspect its fields. `unknown` marks a provider-controlled value that needs narrowing; it does not promise an undocumented shape. Objects can carry additional provider fields, so narrow those before you use them.',
  '', ...modelPages,
].join('\n') + '\n');
