import type { Request, Response, NextFunction } from 'express';
import type { ChatwootClient } from './client.js';
import type { Logger } from '@open-wa/logger';

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

interface WAClient {
  sendText: (to: string, content: string) => Promise<string>;
  sendImage: (to: string, url: string, filename: string, caption: string, quotedMsgId: null, waitForId: boolean) => Promise<string>;
  sendLocation: (to: string, lat: string, lng: string, loc: string) => Promise<string>;
  sendLinkWithAutoPreview: (to: string, url: string, text: string) => Promise<string>;
}

type ExpressMiddleware = (req: Request, res: Response, next?: NextFunction) => Promise<void>;

export function createChatwootMiddleware(
  cwClient: ChatwootClient,
  waClient: WAClient,
  logger: Logger
): ExpressMiddleware {
  return async (req: Request, res: Response): Promise<void> => {
    const body = req.body as WebhookBody;

    if (body.source_id || !body) {
      res.status(200).send();
      return;
    }

    try {
      const messageIds = await processWebhookMessage(body, cwClient, waClient, logger);
      res.status(200).json(messageIds);
    } catch (error) {
      logger.error(`Webhook processing error: ${(error as Error).message}`);
      res.status(400).json({ error: (error as Error).message });
    }
  };
}

async function processWebhookMessage(
  body: WebhookBody,
  cwClient: ChatwootClient,
  waClient: WAClient,
  logger: Logger
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
        content ?? '',
        null,
        true
      );
      messageIds.push(id);
      cwClient.markIgnored(id);
    }

    for (const attachment of restAttachments) {
      const id = await waClient.sendImage(
        to,
        attachment.data_url,
        attachment.data_url.substring(attachment.data_url.lastIndexOf('/') + 1),
        '',
        null,
        true
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
