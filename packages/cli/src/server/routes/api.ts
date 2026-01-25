import { Router, Request, Response } from 'express';
import type { Client } from '@open-wa/client';
import type { Logger } from '@open-wa/logger';
import type { CliOptions } from '../../options.js';
import type { ChatId, ContactId, MessageId } from '@open-wa/schema';

export function createApiRoutes(client: Client, _options: CliOptions, logger: Logger): Router {
  const router = Router();
  
  router.post('/sendText', async (req: Request, res: Response) => {
    try {
      const { to, content } = req.body as { to: ChatId; content: string };
      
      if (!to || !content) {
        res.status(400).json({ error: 'Missing required fields: to, content' });
        return;
      }
      
      const messageId = await client.sendText(to, content);
      res.json({ success: true, messageId });
    } catch (err) {
      logger.error('api_error', { endpoint: 'sendText', error: err });
      res.status(500).json({ error: 'Failed to send message' });
    }
  });
  
  router.post('/sendImage', async (req: Request, res: Response) => {
    try {
      const { to, file, filename, caption } = req.body as {
        to: ChatId;
        file: string;
        filename: string;
        caption?: string;
      };
      
      if (!to || !file || !filename) {
        res.status(400).json({ error: 'Missing required fields: to, file, filename' });
        return;
      }
      
      const messageId = await client.sendImage(to, file, filename, caption);
      res.json({ success: true, messageId });
    } catch (err) {
      logger.error('api_error', { endpoint: 'sendImage', error: err });
      res.status(500).json({ error: 'Failed to send image' });
    }
  });
  
  router.post('/sendFile', async (req: Request, res: Response) => {
    try {
      const { to, file, filename, caption } = req.body as {
        to: ChatId;
        file: string;
        filename: string;
        caption?: string;
      };
      
      if (!to || !file || !filename) {
        res.status(400).json({ error: 'Missing required fields: to, file, filename' });
        return;
      }
      
      const messageId = await client.sendFile(to, file, filename, caption);
      res.json({ success: true, messageId });
    } catch (err) {
      logger.error('api_error', { endpoint: 'sendFile', error: err });
      res.status(500).json({ error: 'Failed to send file' });
    }
  });
  
  router.post('/reply', async (req: Request, res: Response) => {
    try {
      const { to, content, quotedMsgId } = req.body as {
        to: ChatId;
        content: string;
        quotedMsgId: MessageId;
      };
      
      if (!to || !content || !quotedMsgId) {
        res.status(400).json({ error: 'Missing required fields: to, content, quotedMsgId' });
        return;
      }
      
      const result = await client.reply(to, content, quotedMsgId);
      res.json({ success: true, result });
    } catch (err) {
      logger.error('api_error', { endpoint: 'reply', error: err });
      res.status(500).json({ error: 'Failed to send reply' });
    }
  });
  
  router.get('/getAllChats', async (_req: Request, res: Response) => {
    try {
      const chats = await client.getAllChats();
      res.json({ success: true, data: chats });
    } catch (err) {
      logger.error('api_error', { endpoint: 'getAllChats', error: err });
      res.status(500).json({ error: 'Failed to get chats' });
    }
  });
  
  router.get('/getChat/:chatId', async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const chat = await client.getChat(chatId as ChatId);
      
      if (!chat) {
        res.status(404).json({ error: 'Chat not found' });
        return;
      }
      
      res.json({ success: true, data: chat });
    } catch (err) {
      logger.error('api_error', { endpoint: 'getChat', error: err });
      res.status(500).json({ error: 'Failed to get chat' });
    }
  });
  
  router.get('/getAllContacts', async (_req: Request, res: Response) => {
    try {
      const contacts = await client.getAllContacts();
      res.json({ success: true, data: contacts });
    } catch (err) {
      logger.error('api_error', { endpoint: 'getAllContacts', error: err });
      res.status(500).json({ error: 'Failed to get contacts' });
    }
  });
  
  router.get('/getContact/:contactId', async (req: Request, res: Response) => {
    try {
      const { contactId } = req.params;
      const contact = await client.getContact(contactId as ContactId);
      
      if (!contact) {
        res.status(404).json({ error: 'Contact not found' });
        return;
      }
      
      res.json({ success: true, data: contact });
    } catch (err) {
      logger.error('api_error', { endpoint: 'getContact', error: err });
      res.status(500).json({ error: 'Failed to get contact' });
    }
  });
  
  router.post('/createGroup', async (req: Request, res: Response) => {
    try {
      const { name, participants } = req.body as {
        name: string;
        participants: ContactId | ContactId[];
      };
      
      if (!name || !participants) {
        res.status(400).json({ error: 'Missing required fields: name, participants' });
        return;
      }
      
      const result = await client.createGroup(name, participants);
      res.json({ success: true, data: result });
    } catch (err) {
      logger.error('api_error', { endpoint: 'createGroup', error: err });
      res.status(500).json({ error: 'Failed to create group' });
    }
  });
  
  router.post('/archiveChat', async (req: Request, res: Response) => {
    try {
      const { chatId } = req.body as { chatId: ChatId };
      
      if (!chatId) {
        res.status(400).json({ error: 'Missing required field: chatId' });
        return;
      }
      
      const success = await client.archiveChat(chatId);
      res.json({ success });
    } catch (err) {
      logger.error('api_error', { endpoint: 'archiveChat', error: err });
      res.status(500).json({ error: 'Failed to archive chat' });
    }
  });
  
  router.post('/deleteMessage', async (req: Request, res: Response) => {
    try {
      const { chatId, messageId, onlyLocal } = req.body as {
        chatId: ChatId;
        messageId: MessageId | MessageId[];
        onlyLocal?: boolean;
      };
      
      if (!chatId || !messageId) {
        res.status(400).json({ error: 'Missing required fields: chatId, messageId' });
        return;
      }
      
      const success = await client.deleteMessage(chatId, messageId, onlyLocal);
      res.json({ success });
    } catch (err) {
      logger.error('api_error', { endpoint: 'deleteMessage', error: err });
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });
  
  router.post('/react', async (req: Request, res: Response) => {
    try {
      const { messageId, emoji } = req.body as {
        messageId: MessageId;
        emoji: string;
      };
      
      if (!messageId || !emoji) {
        res.status(400).json({ error: 'Missing required fields: messageId, emoji' });
        return;
      }
      
      const success = await client.react(messageId, emoji);
      res.json({ success });
    } catch (err) {
      logger.error('api_error', { endpoint: 'react', error: err });
      res.status(500).json({ error: 'Failed to send reaction' });
    }
  });
  
  router.get('/getMessage/:messageId', async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const message = await client.getMessageById(messageId as MessageId);
      
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      
      res.json({ success: true, data: message });
    } catch (err) {
      logger.error('api_error', { endpoint: 'getMessage', error: err });
      res.status(500).json({ error: 'Failed to get message' });
    }
  });
  
  return router;
}
