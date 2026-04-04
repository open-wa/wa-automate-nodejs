/**
 * Chatwoot webhook handler — Hono-based replacement for Express middleware.
 *
 * Processes incoming Chatwoot webhooks and forwards
 * outgoing messages to WhatsApp via the plugin's client.
 */
import { Hono } from 'hono';
import type { ChatwootClient } from './client.js';
import type { PluginClient, PluginLogger } from '@open-wa/plugin-sdk';

interface WebhookBody {
  source_id?: string;
  event?: string;
  status?: string;
  id?: number;
  messages?: Array<{ content_type?: string }>;
  custom_attributes?: { wanumber?: string };
  meta?: { sender?: { phone_number?: string } };
  timestamp?: number;
  conversation?: {
    id: number;
    meta: { sender: { phone_number?: string } };
    messages: Array<{
      content?: string;
      attachments?: Array<{ data_url: string }>;
    }>;
  };
  message_type?: string;
  private?: boolean;
}

/**
 * Create a Hono sub-app for the Chatwoot webhook route.
 *
 * Handles POST /webhook — the incoming webhook from Chatwoot.
 * Mounted at /plugins/chatwoot/ by the PluginHost.
 */
export function createChatwootRouter(
  cwClient: ChatwootClient,
  waClient: PluginClient,
  logger: PluginLogger
): Hono {
  const app = new Hono();

  app.post('/webhook', async (c) => {
    const body = await c.req.json<WebhookBody>();

    if (body.source_id || !body) {
      return c.json({ ok: true }, 200);
    }

    try {
      const messageIds = await processWebhookMessage(body, cwClient, waClient, logger);
      return c.json(messageIds, 200);
    } catch (error) {
      logger.error(`Webhook processing error: ${(error as Error).message}`);
      return c.json({ error: (error as Error).message }, 400);
    }
  });

  return app;
}

async function processWebhookMessage(
  body: WebhookBody,
  cwClient: ChatwootClient,
  waClient: PluginClient,
  logger: PluginLogger
): Promise<string[]> {
  const messageIds: string[] = [];

  if (!body.conversation) return messageIds;

  const contact = (body.conversation.meta.sender.phone_number ?? '').replace('+', '');
  const to = `${contact}@c.us`;
  const message = body.conversation.messages[0];

  if (
    body.message_type === 'incoming' ||
    body.private ||
    body.event !== 'message_created' ||
    !message ||
    !contact
  ) {
    return messageIds;
  }

  const { attachments, content } = message;
  const convoReg = cwClient.getConvoReg();
  if (!convoReg.has(to)) {
    convoReg.set(to, body.conversation.id);
  }

  if (attachments && attachments.length > 0) {
    const [firstAttachment, ...restAttachments] = attachments;

    if (firstAttachment) {
      const id = await waClient.sendImage(
        to,
        firstAttachment.data_url,
        firstAttachment.data_url.substring(firstAttachment.data_url.lastIndexOf('/') + 1),
        content ?? ''
      );
      messageIds.push(id);
      cwClient.markIgnored(id);
    }

    for (const attachment of restAttachments) {
      const id = await waClient.sendImage(
        to,
        attachment.data_url,
        attachment.data_url.substring(attachment.data_url.lastIndexOf('/') + 1),
        ''
      );
      messageIds.push(id);
      cwClient.markIgnored(id);
    }
  } else if (content) {
    const locationPattern = /@(-?\d*\.?\d*,-?\d*\.?\d*)/g;
    const [possibleLocation, ...restMessage] = content.split(' ');
    const locationMatch = possibleLocation.match(locationPattern);

    if (locationMatch) {
      const [lat, lng] = locationMatch[0].split(',');
      const locationText = restMessage.join(' ') || '';
      const id = await waClient.sendLocation(to, lat, lng, locationText);
      messageIds.push(id);
      cwClient.markIgnored(id);
    } else {
      const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;
      const urlMatch = content.match(urlPattern);

      if (urlMatch?.[0]) {
        const id = await waClient.sendLinkWithAutoPreview(to, urlMatch[0], content);
        messageIds.push(id);
        cwClient.markIgnored(id);
      } else {
        const id = await waClient.sendText(to, content);
        messageIds.push(id);
        cwClient.markIgnored(id);
      }
    }
  }

  logger.info(`Outgoing message IDs: ${JSON.stringify(messageIds)}`);
  return messageIds;
}
