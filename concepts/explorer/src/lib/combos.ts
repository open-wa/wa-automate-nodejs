// Explorer data: every trigger x action combination is composed from the
// documented open-wa snippets in concepts/BRIEF.md and the v5 docs
// (webhook + Chatwoot plugin config). Nothing here invents an API.

export type TriggerId = 'message' | 'order' | 'booking' | 'support';
export type ActionId = 'send' | 'webhook' | 'chatwoot' | 'mcp';

export interface Choice<T extends string> {
  id: T;
  label: string;
  hint: string;
  color: string;
  icon: string; // svg path data, 24x24, stroke icons
}

export const triggers: Choice<TriggerId>[] = [
  {
    id: 'message',
    label: 'A message arrives',
    hint: 'Someone texts your number',
    color: 'var(--sun)',
    icon: 'M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V16h0a2 2 0 0 1-2-2z',
  },
  {
    id: 'order',
    label: 'An order ships',
    hint: 'Your shop fires an event',
    color: 'var(--tangerine)',
    icon: 'M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4zM3.5 7.5 12 11.5l8.5-4M12 11.5v9',
  },
  {
    id: 'booking',
    label: 'A booking is tomorrow',
    hint: 'Your scheduler runs daily',
    color: 'var(--gum)',
    icon: 'M5 6.5h14v13H5zM5 10.5h14M9 4v4M15 4v4M9.5 14.5h2v2h-2z',
  },
  {
    id: 'support',
    label: 'A support question',
    hint: '“Where is my parcel?”',
    color: 'var(--tomato)',
    icon: 'M12 20a8 8 0 1 0-8-8c0 1.4.4 2.8 1 4l-1 4 4-1c1.2.6 2.6 1 4 1zM9.8 9.8a2.3 2.3 0 1 1 3.2 2.1c-.6.3-1 .8-1 1.5M12 16.2v.1',
  },
];

export const actions: Choice<ActionId>[] = [
  {
    id: 'send',
    label: 'Reply or send an update',
    hint: 'sendText, one line',
    color: 'var(--sky)',
    icon: 'M4 12 20 4l-5 16-3.5-6.5zM11.5 13.5 20 4',
  },
  {
    id: 'webhook',
    label: 'Forward to a webhook',
    hint: 'POST JSON to your app',
    color: 'var(--cobalt)',
    icon: 'M9 7.5a3.5 3.5 0 1 1 5.6 2.8L12 15M7.2 13.2A3.5 3.5 0 1 0 10 18.5h6M16.5 15a3.5 3.5 0 1 1-1.6 6.6',
  },
  {
    id: 'chatwoot',
    label: 'Open it in Chatwoot',
    hint: 'A shared support inbox',
    color: 'var(--lilac)',
    icon: 'M4 6h16v10H8l-4 3.5zM8 10h8M8 13h5',
  },
  {
    id: 'mcp',
    label: 'Ask an AI agent',
    hint: 'Tools over MCP',
    color: 'var(--ink)',
    icon: 'M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8zM18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  },
];

export const destIcons: Record<ActionId, string> = {
  send: 'M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3zM11 18h2',
  webhook: 'M4 5h16v14H4zM4 9h16M7 7h.01M9.5 7h.01M8 13l2 2-2 2M12 17h4',
  chatwoot: 'M4 13l2.5-8h11l2.5 8v6H4zM4 13h5l1 2h4l1-2h5',
  mcp: 'M7 8h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM12 4.5V8M9.5 13h.01M14.5 13h.01M10 16h4',
};

export const inspectorKicker: Record<ActionId, string> = {
  send: 'Easy API call',
  webhook: 'Webhook delivery',
  chatwoot: 'Chatwoot',
  mcp: 'MCP tool call',
};

export interface Bubble {
  who: 'business' | 'customer';
  text: string;
}

export interface CodeBlock {
  file: string;
  lang: 'ts' | 'js' | 'bash';
  code: string;
}

export interface Combo {
  trigger: TriggerId;
  action: ActionId;
  outbound: boolean;
  nodes: [string, string, string, string];
  caption: [string, string, string, string];
  first: Bubble; // shown at step 1
  reply?: Bubble; // customer reply (outbound triggers + handling actions), step 3
  result?: Bubble; // shown at step 4
  inspector: { kind: ActionId; title: string; body: string };
  code: CodeBlock[];
  note: string;
}

const PHONE = '447700900123@c.us';

const socketHead = `import { SocketClient } from '@open-wa/socket-client';

const client = await SocketClient.connect('http://localhost:8080', 'your-secure-key');
`;

const code = {
  messageSend: `${socketHead}client.onMessage(async (message) => {
  if (message.body === 'Hi') await client.sendText(message.from, 'Hello!');
});`,
  supportSend: `${socketHead}client.onMessage(async (message) => {
  if (message.body.includes('parcel')) {
    await client.sendText(message.from, 'Sorry! Track it here: [tracking-link]');
  }
});`,
  orderCurl: `curl -X POST http://localhost:8080/api/messages/sendText \\
  -H "Content-Type: application/json" \\
  -d '{"to": "${PHONE}", "content": "Your order [#1042] has shipped!"}'`,
  booking: `${socketHead}
// Run once a day from your scheduler
for (const booking of await getTomorrowsBookings()) { // [your code]
  await client.sendText(booking.chatId, \`See you tomorrow at \${booking.time}!\`);
}`,
  webhook: `// wa.config.mjs
export default {
  sessionId: 'sales',
  port: 8080,
  plugins: ['@open-wa/integration-webhook'],
  pluginConfig: {
    webhook: {
      url: 'https://[your-app]/webhooks/open-wa',
      events: ['message.received'],
    },
  },
};`,
  chatwoot: `// wa.config.mjs
export default {
  sessionId: 'sales',
  port: 8080,
  apiKey: process.env.WA_API_KEY,
  plugins: ['@open-wa/integration-chatwoot'],
  pluginConfig: {
    chatwoot: {
      chatwootUrl: 'https://[your-chatwoot]/api/v1/accounts/[id]',
      chatwootApiAccessToken: process.env.CHATWOOT_API_ACCESS_TOKEN,
      apiHost: 'https://[your-open-wa-host]',
      apiKey: process.env.WA_API_KEY,
    },
  },
};`,
  mcp: `// wa.config.mjs: MCP
export default { apiKey: process.env.WA_API_KEY, port: 8080, mcp: { enabled: true, path: '/mcp' } };`,
  start: `npx @open-wa/wa-automate@latest --config ./wa.config.mjs --port 8080`,
};

const triggerText: Record<TriggerId, { node: string; caption: string; first: Bubble; reply?: Bubble }> = {
  message: {
    node: 'Message arrives',
    caption: 'A customer texts “Hi”.',
    first: { who: 'customer', text: 'Hi' },
  },
  support: {
    node: 'Support question',
    caption: 'A customer asks where their parcel is.',
    first: { who: 'customer', text: 'My parcel hasn’t arrived yet. Can you help?' },
  },
  order: {
    node: 'Your shop: shipped',
    caption: 'Your shop marks order [#1042] as shipped.',
    first: { who: 'business', text: 'Your order [#1042] has shipped!' },
    reply: { who: 'customer', text: 'Can I change the delivery address?' },
  },
  booking: {
    node: 'Your scheduler: 9am',
    caption: 'Your scheduler finds tomorrow’s bookings.',
    first: { who: 'business', text: 'See you tomorrow at [7pm]!' },
    reply: { who: 'customer', text: 'Could we make it 8pm instead?' },
  },
};

const agentReply: Record<TriggerId, string> = {
  message: 'Hello! How can I help today?',
  support: 'Sorry for the wait. Let me check on it for you.',
  order: 'Sure. Which address should we use?',
  booking: 'Let me check if 8pm is free.',
};

const humanReply: Record<TriggerId, string> = {
  message: 'Hi! [Sam] here. What can I do for you?',
  support: 'Hi, [Sam] from support here. Looking into it now.',
  order: 'Hi, [Sam] here. Send me the new address.',
  booking: 'Hi, [Sam] here. Let me see what we can do.',
};

export function getCombo(trigger: TriggerId, action: ActionId): Combo {
  const t = triggerText[trigger];
  const outbound = trigger === 'order' || trigger === 'booking';
  const lastCustomer = (outbound ? t.reply! : t.first).text;

  const nodes: Combo['nodes'] = [t.node, 'open-wa', '', ''];
  const caption: Combo['caption'] = [
    t.caption,
    outbound ? 'Your code calls sendText on open-wa.' : 'open-wa picks it up on your server.',
    '',
    '',
  ];
  let reply: Bubble | undefined;
  let result: Bubble | undefined;
  let inspector: Combo['inspector'];
  let blocks: CodeBlock[] = [];
  let note = '';

  const sendBlock: CodeBlock | null =
    trigger === 'order'
      ? { file: 'terminal', lang: 'bash', code: code.orderCurl }
      : trigger === 'booking'
        ? { file: 'reminders.ts', lang: 'ts', code: code.booking }
        : null;

  if (action === 'send') {
    nodes[2] = outbound ? 'Send an update' : 'Reply';
    nodes[3] = 'Customer’s phone';
    if (outbound) {
      caption[2] = 'open-wa sends it from your WhatsApp account.';
      caption[3] = 'The update lands on the customer’s phone.';
      inspector = { kind: 'send', title: 'sendText', body: `to: ${PHONE}\ncontent: “${t.first.text}”` };
      blocks = [sendBlock!];
      note = trigger === 'order' ? 'Call the Easy API from any language that can make an HTTP request.' : 'SocketClient talks to a running Easy API from another Node.js app.';
    } else {
      const text = trigger === 'support' ? 'Sorry! Track it here: [tracking-link]' : 'Hello!';
      result = { who: 'business', text };
      caption[2] = 'Your bot answers with sendText.';
      caption[3] = 'The customer gets the reply.';
      inspector = { kind: 'send', title: 'sendText', body: `to: message.from\ncontent: “${text}”` };
      blocks = [{ file: 'bot.ts', lang: 'ts', code: trigger === 'support' ? code.supportSend : code.messageSend }];
      note = 'SocketClient: HTTP RPC for commands, Server-Sent Events for events.';
    }
  } else {
    reply = outbound ? t.reply : undefined;
    const pre = outbound ? 'The customer replies. ' : '';
    if (action === 'webhook') {
      nodes[2] = 'Webhook';
      nodes[3] = 'Your app';
      caption[2] = `${pre}open-wa POSTs it to your webhook.`;
      caption[3] = 'Your app takes it from there.';
      inspector = {
        kind: 'webhook',
        title: 'POST /webhooks/open-wa',
        body: `{\n  "event": "message.received",\n  "sessionId": "sales",\n  "payload": { "message": {\n    "from": "${PHONE}",\n    "body": "${lastCustomer.replace(/[’]/g, "'")}"\n  } }\n}`,
      };
      blocks = [{ file: 'wa.config.mjs', lang: 'js', code: code.webhook }];
      note = 'Load @open-wa/integration-webhook as a plugin, then point it at your endpoint.';
    } else if (action === 'chatwoot') {
      nodes[2] = 'Chatwoot';
      nodes[3] = 'Shared inbox';
      caption[2] = `${pre}open-wa opens a Chatwoot conversation.`;
      caption[3] = 'A teammate answers from the inbox.';
      result = { who: 'business', text: humanReply[trigger] };
      inspector = { kind: 'chatwoot', title: 'New conversation', body: `+44 7700 900123\n“${lastCustomer}”` };
      blocks = [{ file: 'wa.config.mjs', lang: 'js', code: code.chatwoot }];
      note = 'Install @open-wa/integration-chatwoot and set it under pluginConfig.chatwoot.';
    } else {
      nodes[2] = 'MCP at /mcp';
      nodes[3] = 'Your AI agent';
      caption[2] = `${pre}Your AI agent reads it through MCP.`;
      caption[3] = 'The agent answers with the sendText tool.';
      result = { who: 'business', text: agentReply[trigger] };
      inspector = { kind: 'mcp', title: 'Tool call: sendText', body: `to: ${PHONE}\ncontent: “${agentReply[trigger]}”` };
      blocks = [{ file: 'wa.config.mjs', lang: 'js', code: code.mcp }];
      note = 'Every Easy API method becomes a tool. Point your agent at http://localhost:8080/mcp.';
    }
    blocks.push({ file: 'terminal', lang: 'bash', code: code.start });
    if (sendBlock) blocks.unshift(sendBlock);
  }

  return {
    trigger,
    action,
    outbound,
    nodes,
    caption,
    first: t.first,
    reply,
    result,
    inspector: inspector!,
    code: blocks,
    note,
  };
}

// Tiny highlighter: comments, strings, keywords, placeholders.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlight(src: string, lang: CodeBlock['lang']): string {
  const re =
    lang === 'bash'
      ? /(#[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\bcurl\b|\bnpx\b|\bdocker\b)|(\s--?[a-zA-Z-]+)/g
      : /(\/\/[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(import|from|const|await|async|export|default|for|of|if|true|false)\b|(\b[a-zA-Z]+(?=\())/g;
  let out = '';
  let last = 0;
  for (const m of src.matchAll(re)) {
    out += esc(src.slice(last, m.index));
    const [whole, c, s, k, f] = m;
    const cls = c ? 'c' : s ? 's' : k ? 'k' : f ? 'f' : '';
    out += `<span class="t-${cls}">${esc(whole)}</span>`;
    last = m.index! + whole.length;
  }
  out += esc(src.slice(last));
  // brackets as placeholders
  return out.replace(/\[([#\w][\w\s.#:/-]{0,36})\]/g, '<span class="t-p">[$1]</span>');
}

/** Code panel as a tab set (one file visible at a time keeps the stage steady). */
export function renderCode(blocks: CodeBlock[]): string {
  const many = blocks.length > 1;
  const tabs = blocks
    .map(
      (b, i) =>
        `<button type="button" role="tab" class="code-tab" id="ct-${i}" aria-controls="cp-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${many ? `<b>${i + 1}</b>` : '<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>'}${esc(b.file)}</button>`,
    )
    .join('');
  const panels = blocks
    .map(
      (b, i) =>
        `<div class="code-panel" role="tabpanel" id="cp-${i}" aria-labelledby="ct-${i}" tabindex="0"${i === 0 ? '' : ' hidden'}><pre><code>${highlight(b.code, b.lang)}</code></pre></div>`,
    )
    .join('');
  return `<div class="code-tabs" role="tablist" aria-label="Code for this combo">${tabs}</div>${panels}`;
}
