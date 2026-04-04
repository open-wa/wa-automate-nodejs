import type { Logger } from '@open-wa/logger';
import type { ChatwootConfig } from './config.js';

interface Contact {
  id: number;
  phone_number?: string;
  name?: string;
  email?: string;
}

interface Conversation {
  id: number;
  inbox_id: number;
  status: string;
}

interface CWMessage {
  id: number;
  content?: string;
  content_type?: string;
  message_type?: number;
  created_at?: number;
}

interface CWResponse<T> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Client for interacting with the Chatwoot API.
 * Uses native fetch instead of axios.
 */
export class ChatwootClient {
  private readonly apiAccessToken: string;
  private readonly origin: string;
  private accountId: string;
  private inboxId: string;
  private expectedSelfWebhookUrl: string;
  private readonly logger: Logger;
  private readonly forceUpdateCwWebhook: boolean;

  // Registry mappings
  private readonly contactReg: Map<string, number> = new Map();
  private readonly convoReg: Map<string, number> = new Map();
  private readonly ignoreMap: Map<string, boolean | number> = new Map();

  constructor(config: ChatwootConfig, logger: Logger) {
    const url = new URL(config.chatwootUrl);
    this.origin = url.origin;
    this.apiAccessToken = config.chatwootApiAccessToken;
    this.logger = logger;
    this.forceUpdateCwWebhook = config.forceUpdateCwWebhook ?? false;

    // Parse account and inbox IDs from URL
    const match = config.chatwootUrl.match(/\/(app|(api\/v1))\/accounts\/(\d+)(\/inbox(es)?\/(\d+))?/);
    this.accountId = match?.[3] ?? '';
    this.inboxId = match?.[6] ?? '';

    // Build expected webhook URL
    const protocol = config.https ? 'https' : 'http';
    const host = config.apiHost ?? `${protocol}://${config.host}:${config.port}`;
    this.expectedSelfWebhookUrl = `${host}/plugins/chatwoot/webhook`;
    if (config.apiKey) {
      this.expectedSelfWebhookUrl += `?api_key=${config.apiKey}`;
    }
  }

  /**
   * Make a request to the Chatwoot API using native fetch.
   */
  async cwReq<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<CWResponse<T>> {
    const url = `${this.origin}/api/v1/accounts/${this.accountId}/${path}`;

    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const fetchHeaders: Record<string, string> = {
      api_access_token: this.apiAccessToken,
      ...headers,
    };
    if (!isFormData && data) {
      fetchHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        method,
        headers: fetchHeaders,
        body: data
          ? isFormData
            ? (data as BodyInit)
            : JSON.stringify(data)
          : undefined,
      });

      this.logger.debug(`CW REQUEST: ${response.status} ${method} ${url}`);

      const responseData = await response.json() as T;

      return {
        ok: response.ok,
        status: response.status,
        data: responseData,
      };
    } catch (error) {
      this.logger.error(`CW REQ ERROR: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Initialize the Chatwoot client - find or create inbox.
   */
  async init(sessionId: string, hostAccountNumber?: string): Promise<void> {
    this.logger.info('Setting up Chatwoot integration...');

    // Get account ID if not set
    if (!this.accountId) {
      const response = await fetch(`${this.origin}/api/v1/profile`, {
        headers: { api_access_token: this.apiAccessToken },
      });
      const data = await response.json() as { account_id: number };
      this.accountId = String(data.account_id);
      this.logger.info(`Got account ID: ${this.accountId}`);
    }

    // Find or create inbox
    if (!this.inboxId) {
      this.logger.info('Inbox ID missing, searching...');
      const { data } = await this.cwReq<{ payload: Array<{ id: number; additional_attributes?: { hostAccountNumber?: string } }> }>(
        'GET',
        'inboxes'
      );
      
      const existingInbox = data.payload.find(
        (inbox) => inbox.additional_attributes?.hostAccountNumber === hostAccountNumber
      );

      if (existingInbox) {
        this.inboxId = String(existingInbox.id);
        this.logger.info(`Found existing inbox: ${this.inboxId}`);
      } else {
        this.logger.info('Creating new inbox...');
        const { data: newInbox } = await this.cwReq<{ id: number }>('POST', 'inboxes', {
          name: `open-wa-${hostAccountNumber ?? sessionId}`,
          channel: {
            phone_number: hostAccountNumber,
            type: 'api',
            webhook_url: this.expectedSelfWebhookUrl,
            additional_attributes: {
              sessionId,
              hostAccountNumber,
            },
          },
        });
        this.inboxId = String(newInbox.id);
        this.logger.info(`Created inbox: ${this.inboxId}`);
      }
    }

    // Update inbox webhook if needed
    if (this.forceUpdateCwWebhook) {
      await this.cwReq('PATCH', `inboxes/${this.inboxId}`, {
        channel: {
          webhook_url: this.expectedSelfWebhookUrl,
        },
      });
      this.logger.info('Updated inbox webhook URL');
    }
  }

  /**
   * Search for a contact by phone number.
   */
  async searchContact(phoneNumber: string): Promise<Contact | null> {
    const cleanNumber = phoneNumber.replace('@c.us', '');
    try {
      const { data } = await this.cwReq<{ payload: Contact[] }>(
        'GET',
        `contacts/search?q=${cleanNumber}&sort=phone_number`
      );
      return data.payload.find((c) => c.phone_number?.includes(cleanNumber)) ?? null;
    } catch (error) {
      this.logger.error(`Search contact error: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Create a new contact.
   */
  async createContact(contact: {
    id: string;
    formattedName?: string;
    name?: string;
    shortName?: string;
    profilePicThumbObj?: { eurl?: string };
  }): Promise<Contact | null> {
    try {
      const { data } = await this.cwReq<{ payload: { contact: Contact } }>('POST', 'contacts', {
        identifier: contact.id,
        name: contact.formattedName ?? contact.name ?? contact.shortName ?? contact.id,
        phone_number: `+${contact.id.replace('@c.us', '')}`,
        avatar_url: contact.profilePicThumbObj?.eurl,
        custom_attributes: {
          'wa:number': contact.id.replace('@c.us', ''),
        },
      });
      return data.payload.contact;
    } catch (error) {
      this.logger.error(`Create contact error: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Get or create a conversation for a contact.
   */
  async getContactConversation(contactId: string): Promise<Conversation | null> {
    const cwContactId = this.contactReg.get(contactId);
    if (!cwContactId) return null;

    try {
      const { data } = await this.cwReq<{ payload: Conversation[] }>(
        'GET',
        `contacts/${cwContactId}/conversations`
      );
      
      const inboxConvos = data.payload
        .filter((c) => String(c.inbox_id) === this.inboxId)
        .sort((a, b) => a.id - b.id);

      const openConvo = inboxConvos.find((c) => c.status === 'open');
      if (openConvo) return openConvo;

      const resolvedConvo = inboxConvos[0];
      if (resolvedConvo) {
        await this.openConversation(resolvedConvo.id);
        return resolvedConvo;
      }

      return null;
    } catch (error) {
      this.logger.error(`Get conversation error: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Create a new conversation for a contact.
   */
  async createConversation(contactId: number): Promise<Conversation | null> {
    try {
      const { data } = await this.cwReq<Conversation>('POST', 'conversations', {
        contact_id: contactId,
        inbox_id: this.inboxId,
      });
      return data;
    } catch (error) {
      this.logger.error(`Create conversation error: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Open/reopen a conversation.
   */
  async openConversation(conversationId: number, status = 'open'): Promise<void> {
    try {
      await this.cwReq('POST', `conversations/${conversationId}/toggle_status`, { status });
    } catch (error) {
      this.logger.error(`Open conversation error: ${(error as Error).message}`);
    }
  }

  /**
   * Send a text message to a conversation.
   */
  async sendConversationMessage(
    content: string,
    contactId: string,
    message: { id: string; fromMe?: boolean }
  ): Promise<CWMessage | null> {
    const convoId = this.convoReg.get(contactId);
    if (!convoId) return null;

    this.logger.info(`WA=>CW ${contactId}: ${content.substring(0, 50)}...`);
    try {
      const { data } = await this.cwReq<CWMessage>('POST', `conversations/${convoId}/messages`, {
        content,
        message_type: message.fromMe ? 'outgoing' : 'incoming',
        private: false,
        echo_id: message.id,
        source_id: message.id,
      });
      return data;
    } catch (error) {
      this.logger.error(`Send message error: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Send an attachment message to a conversation.
   * Uses native FormData (works in Node 18+, Bun, Deno, etc).
   */
  async sendAttachmentMessage(
    content: string,
    contactId: string,
    message: { id: string; mimetype: string; t: number },
    fileData: string
  ): Promise<CWMessage | null> {
    const convoId = this.convoReg.get(contactId);
    if (!convoId) return null;

    try {
      // Determine the file extension from MIME type
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
        'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'mp4',
        'video/mp4': 'mp4', 'video/quicktime': 'mov',
        'application/pdf': 'pdf',
      };
      const extension = mimeToExt[message.mimetype] ?? 'bin';
      const filename = `${message.t}.${extension}`;

      // Convert base64 to Blob (works in Node 18+, Bun, Deno, Workers)
      const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const blob = new Blob([binaryData], { type: message.mimetype });

      const formData = new FormData();
      formData.append('attachments[]', blob, filename);
      formData.append('content', content || '');
      formData.append('message_type', 'incoming');

      const url = `${this.origin}/api/v1/accounts/${this.accountId}/conversations/${convoId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { api_access_token: this.apiAccessToken },
        body: formData,
      });

      const data = await response.json() as CWMessage;
      return data;
    } catch (error) {
      this.logger.error(`Send attachment error: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Get all messages in a conversation.
   */
  async getAllInboxMessages(conversationId: string | number): Promise<CWMessage[]> {
    const convoId = typeof conversationId === 'string' 
      ? this.convoReg.get(conversationId) ?? conversationId
      : conversationId;

    try {
      const { data } = await this.cwReq<{ payload: CWMessage[] }>(
        'GET',
        `conversations/${convoId}/messages`
      );
      return data.payload;
    } catch (error) {
      this.logger.error(`Get messages error: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Process an incoming WhatsApp message and sync to Chatwoot.
   */
  async processWAMessage(
    message: {
      id: string;
      chatId: string;
      body?: string;
      type: string;
      fromMe?: boolean;
      deprecatedMms3Url?: string;
      mimetype?: string;
      t: number;
      cloudUrl?: string;
      text?: string;
      lat?: number;
      lng?: number;
      loc?: string;
      selectedButtonId?: string;
      listResponse?: { rowId: string };
      ctwaContext?: { sourceUrl?: string };
      chat?: { contact: unknown };
    },
    decryptMedia?: (msg: unknown) => Promise<string>
  ): Promise<void> {
    try {
      // Skip group and broadcast messages
      if (message.chatId.includes('g') || message.chatId.includes('broadcast')) {
        return;
      }

      // Skip ignored messages
      if (this.ignoreMap.has(message.id)) {
        return;
      }

      // Ensure contact exists
      if (!this.contactReg.has(message.chatId)) {
        const contact = await this.searchContact(message.chatId);
        if (contact) {
          this.contactReg.set(message.chatId, contact.id);
        } else if (message.chat?.contact) {
          const newContact = await this.createContact(message.chat.contact as never);
          if (newContact) {
            this.contactReg.set(message.chatId, newContact.id);
          }
        }
      }

      // Ensure conversation exists
      if (!this.convoReg.has(message.chatId)) {
        const conversation = await this.getContactConversation(message.chatId);
        if (conversation) {
          this.convoReg.set(message.chatId, conversation.id);
        } else {
          const contactId = this.contactReg.get(message.chatId);
          if (contactId) {
            const newConvo = await this.createConversation(contactId);
            if (newConvo) {
              this.convoReg.set(message.chatId, newConvo.id);
            }
          }
        }
      }

      // Prepare message content
      let text = message.body ?? '';
      let hasAttachments = false;

      switch (message.type) {
        case 'location':
          text = `Location Message:\n\n${message.loc ?? ''}\n\nhttps://www.google.com/maps?q=${message.lat},${message.lng}`;
          break;
        case 'buttons_response':
          text = message.selectedButtonId ?? '';
          break;
        case 'document':
        case 'image':
        case 'audio':
        case 'ptt':
        case 'video':
          if (message.cloudUrl) {
            text = `FILE:\t${message.cloudUrl}\n\nMESSAGE:\t${message.text ?? ''}`;
          } else {
            text = message.text ?? '';
            hasAttachments = true;
          }
          break;
        default:
          text = message.ctwaContext?.sourceUrl
            ? `${message.body ?? ''}\n\n${message.ctwaContext.sourceUrl}`
            : message.body ?? '';
          break;
      }

      // Send to Chatwoot
      if (hasAttachments && decryptMedia && message.deprecatedMms3Url && message.mimetype) {
        const fileData = await decryptMedia(message);
        await this.sendAttachmentMessage(text, message.chatId, message as never, fileData);
      } else {
        await this.sendConversationMessage(text, message.chatId, message);
      }
    } catch (error) {
      this.logger.error(`Process message error: ${(error as Error).message}`);
    }
  }

  /**
   * Mark a message as ignored (to prevent echo loops).
   */
  markIgnored(messageId: string): void {
    this.ignoreMap.set(messageId, true);
  }

  /**
   * Get the registry for a conversation.
   */
  getConvoReg(): Map<string, number> {
    return this.convoReg;
  }

  /**
   * Get the inbox ID.
   */
  getInboxId(): string {
    return this.inboxId;
  }
}
