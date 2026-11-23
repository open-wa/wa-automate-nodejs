import { randomUUID } from 'node:crypto';
import { Webhook } from 'standardwebhooks';
import type { ExecutionResult } from '../execution/kernel';
import type { ApprovalCodeRequest } from './oauth';

export interface ApprovalDeliveryOptions {
  sessionId: string;
  log: boolean;
  /** Where to POST the code; undefined skips the webhook. */
  webhookUrl?: string;
  webhookSecret?: string;
  sendToSelf: boolean;
  invoke: (functionName: string, payload: Record<string, unknown>) => Promise<ExecutionResult>;
  /** Called with the ID of a message open-wa sent, so it isn't mistaken for a person replying. */
  noteOwnSend?: (messageId: string) => void;
  write?: (line: string) => void;
}

export const APPROVAL_EVENT = 'mcp.oauth.approval_requested';

/**
 * Delivers one-time approval codes only to channels the session owner controls: the local log, the owner's
 * webhook, and the account's own "Message yourself" chat. Never through MCP events or the dashboard socket,
 * because a connected client could then approve new clients itself.
 */
export function createApprovalDelivery(options: ApprovalDeliveryOptions) {
  const write = options.write ?? ((line: string) => console.log(line));
  const time = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (request: ApprovalCodeRequest) => {
    const summary = `${request.clientName} (${request.redirectHost}) wants MCP access. Request ${request.requestId}, one-time code ${request.code}, valid until ${time(request.expiresAt)}.`;
    if (options.log) write(`[open-wa] ${summary}`);

    if (options.webhookUrl) {
      const id = `msg_${randomUUID()}`;
      const timestamp = new Date();
      const body = JSON.stringify({
        type: APPROVAL_EVENT, timestamp: timestamp.toISOString(),
        data: { sessionId: options.sessionId, ...request, expiresAt: new Date(request.expiresAt).toISOString() },
      });
      const headers: Record<string, string> = { 'content-type': 'application/json', 'webhook-id': id, 'webhook-timestamp': String(Math.floor(timestamp.getTime() / 1000)) };
      if (options.webhookSecret) headers['webhook-signature'] = new Webhook(options.webhookSecret).sign(id, timestamp, body);
      void fetch(options.webhookUrl, { method: 'POST', headers, body, signal: AbortSignal.timeout(10_000) })
        .then(res => { if (!res.ok) write(`[open-wa] The approval code webhook answered ${res.status}.`); })
        .catch(error => write(`[open-wa] Could not send the approval code webhook: ${error instanceof Error ? error.message : String(error)}`));
    }

    if (options.sendToSelf) {
      void (async () => {
        const host = await options.invoke('getHostNumber', {});
        if (!host.success || typeof host.data !== 'string' || !host.data) throw new Error(host.error ?? 'this account\'s number is not available yet');
        const sent = await options.invoke('sendText', {
          to: `${host.data.replace(/\D/g, '')}@c.us`,
          content: `🔐 ${request.clientName} wants access to this WhatsApp through open-wa.\n\nRequest ${request.requestId}\nCode: ${request.code}\n\nEnter the code on the approval page only if you started this. It expires at ${time(request.expiresAt)}.`,
        });
        if (!sent.success) throw new Error(sent.error ?? 'sending failed');
        if (typeof sent.data === 'string') options.noteOwnSend?.(sent.data);
      })().catch(error => write(`[open-wa] Could not send the approval code to this account's own chat: ${error instanceof Error ? error.message : String(error)}`));
    }
  };
}
