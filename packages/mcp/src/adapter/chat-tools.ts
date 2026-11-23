import type { McpEventsService } from '../events/service';
import type { ExecutionResult } from '../execution/kernel';

/**
 * MCP-only tools for an assistant that runs a conversation: they take the values an MCP client actually
 * holds (a message ID, a file it was given, a chat ID) instead of the raw objects the HTTP methods expect.
 */
type Content =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'audio'; data: string; mimeType: string }
  | { type: 'resource'; resource: { uri: string; mimeType: string; blob: string } };
export interface ToolResult { content: Content[]; isError?: boolean }
type Invoke = (functionName: string, payload: Record<string, unknown>) => Promise<ExecutionResult>;

const MAX_MEDIA_BYTES = 15 * 1024 * 1024;
const chatId = { type: 'string', description: 'Conversation ID from a message event, such as 447700900123@c.us' };
/** ChatGPT's file object; the schema must declare exactly these four properties (openai/fileParams). */
const openAIFile = {
  type: 'object',
  properties: {
    download_url: { type: 'string' }, file_id: { type: 'string' },
    mime_type: { type: 'string' }, file_name: { type: 'string' },
  },
  required: ['download_url', 'file_id'],
  additionalProperties: false,
};

export const chatToolDefinitions = [
  {
    name: 'media.getForMessage',
    description: 'Open the photo, voice note, video or document attached to a WhatsApp message, by message ID. Images and audio are returned as content you can view or listen to.',
    inputSchema: { type: 'object', properties: { messageId: { type: 'string', description: 'messageId from a message event' } }, required: ['messageId'], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  },
  {
    name: 'messages.sendAttachment',
    description: 'Send a file you hold, such as an image you created or one the user shared, to a WhatsApp chat. Images and videos are shown inline; other files arrive as documents.',
    inputSchema: {
      type: 'object',
      properties: { to: chatId, file: openAIFile, caption: { type: 'string', description: 'Optional caption' } },
      required: ['to', 'file'], additionalProperties: false,
    },
    annotations: { readOnlyHint: false, openWorldHint: true, destructiveHint: false },
    _meta: { 'openai/fileParams': ['file'] },
  },
  {
    name: 'automation.getStatus',
    description: 'Check whether automation is paused for a chat because a person replied from the WhatsApp app. Message events for a paused chat are not delivered until it resumes.',
    inputSchema: { type: 'object', properties: { chatId }, required: ['chatId'], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  },
  {
    name: 'automation.pause',
    description: 'Pause message events for a chat, for example when a person should take over.',
    inputSchema: {
      type: 'object',
      properties: { chatId, minutes: { type: 'number', minimum: 1, maximum: 10080, description: 'How long to pause; defaults to the server setting' } },
      required: ['chatId'], additionalProperties: false,
    },
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
  },
  {
    name: 'automation.resume',
    description: 'Resume message events for a chat that was paused.',
    inputSchema: { type: 'object', properties: { chatId }, required: ['chatId'], additionalProperties: false },
    annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
  },
] as const;

const text = (value: unknown): Content => ({ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value ?? null, null, 2) });
const failure = (message: string): ToolResult => ({ isError: true, content: [text(message)] });
const record = (value: unknown) => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const string = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;

/** Turns a data URL into MCP content an assistant can view or play; other values stay text. */
export function mediaContent(value: unknown, label = 'media'): Content[] | undefined {
  const raw = typeof value === 'string' ? value : string(record(value).data) ?? string(record(value).dataUrl);
  const match = raw ? /^data:([\w.+-]+\/[\w.+-]+)(?:;[^,]*)?;base64,(.+)$/s.exec(raw) : null;
  if (!match) return;
  const [, mimeType, data] = match;
  const bytes = Math.floor(data.length * 3 / 4);
  if (bytes > MAX_MEDIA_BYTES) return [text(`The ${label} is ${Math.round(bytes / 1048576)} MB, more than the ${MAX_MEDIA_BYTES / 1048576} MB that can be returned here.`)];
  const summary = text({ mimeType, bytes });
  const kind = mimeType.split('/')[0];
  // Voice notes are Ogg/Opus; clients accept the audio content type with that MIME type.
  if (kind === 'image') return [summary, { type: 'image', data, mimeType }];
  if (kind === 'audio') return [summary, { type: 'audio', data, mimeType }];
  return [summary, { type: 'resource', resource: { uri: `openwa:media/${label}`, mimeType, blob: data } }];
}

export async function callChatTool(name: string, args: Record<string, unknown>, invoke: Invoke, events?: McpEventsService): Promise<ToolResult | undefined> {
  switch (name) {
    case 'media.getForMessage': {
      const messageId = string(args.messageId);
      if (!messageId) return failure('messageId is required');
      const message = await invoke('getMessageById', { messageId });
      if (!message.success || !message.data) return failure(message.error ?? 'Message not found');
      const type = string(record(message.data).type);
      if (!type || !['image', 'audio', 'ptt', 'video', 'document', 'sticker'].includes(type)) return failure(`Message ${messageId} has no media (type ${type ?? 'unknown'})`);
      const media = await invoke('decryptMedia', { message: message.data });
      if (!media.success) return failure(media.error ?? 'Could not download the media');
      return { content: mediaContent(media.data, messageId) ?? [text('The media could not be read as a file')] };
    }
    case 'messages.sendAttachment': {
      const to = string(args.to);
      const file = record(args.file);
      const url = string(file.download_url);
      if (!to || !url) return failure('to and file.download_url are required');
      if (!/^https:\/\//i.test(url)) return failure('file.download_url must be an HTTPS URL');
      const filename = string(file.file_name) ?? `attachment.${(string(file.mime_type)?.split('/')[1] ?? 'bin').replace(/[^a-z0-9]/gi, '')}`;
      const caption = string(args.caption);
      const sent = await invoke('sendFileFromUrl', { to, url, filename, options: { type: 'auto', ...(caption ? { caption } : {}) } });
      if (!sent.success) return failure(sent.error ?? 'Sending failed');
      if (typeof sent.data === 'string') events?.noteOwnSend(sent.data);
      return { content: [text({ messageId: sent.data ?? null })] };
    }
    case 'automation.getStatus':
    case 'automation.pause':
    case 'automation.resume': {
      if (!events) return failure('MCP Events are disabled on this server');
      const chat = string(args.chatId);
      if (!chat) return failure('chatId is required');
      if (name === 'automation.pause') events.pauseChat(chat, typeof args.minutes === 'number' ? args.minutes * 60_000 : undefined, 'assistant');
      if (name === 'automation.resume') events.resumeChat(chat);
      return { content: [text(events.chatStatus(chat))] };
    }
    default:
      return undefined;
  }
}
