import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createAsyncAPI } from '@fumadocs/asyncapi/server';
import { generateFiles, type AsyncAPI } from '@fumadocs/asyncapi';
import { createAsyncApiDocument } from '../../../packages/schema/src/events/asyncapi';

const app = new URL('../', import.meta.url);
const version = JSON.parse(readFileSync(new URL('../../../packages/schema/package.json', import.meta.url), 'utf8')).version;
const document = createAsyncApiDocument({ version });
const json = `${JSON.stringify(document, null, 2)}\n`;
const schemaDir = new URL('src/generated/', app);
mkdirSync(schemaDir, { recursive: true });
mkdirSync(new URL('public/', app), { recursive: true });
writeFileSync(new URL('asyncapi.json', schemaDir), json);
writeFileSync(new URL('public/asyncapi.json', app), json);

type Transport = 'sse' | 'webhook' | 'mcp';
type JsonObject = { properties?: Record<string, unknown>; $ref?: string };

/** How each transport delivers an event, and the guide that sets it up. */
const TRANSPORTS: Record<Transport, { noun: string; sends: string; verb: string; envelope: string; guide: { title: string; href: string } }> = {
  webhook: { noun: 'Webhook payload', sends: 'sends', verb: 'sends this webhook', envelope: 'The request body has', guide: { title: 'Receive webhooks', href: '/docs/guides/receive-webhooks' } },
  sse: { noun: 'Server-sent event', sends: 'streams', verb: 'streams this event from `/api/events`', envelope: "Each frame's data has", guide: { title: 'Receive messages', href: '/docs/guides/receive-messages' } },
  mcp: { noun: 'MCP Events callback', sends: 'sends', verb: 'sends this MCP Events callback', envelope: 'The callback body has', guide: { title: 'Watch WhatsApp from ChatGPT', href: '/docs/guides/mcp-events' } },
};

const code = (names: string[]) => names.map((name) => `\`${name}\``).join(', ').replace(/, ([^,]+)$/, ' and $1');

/** The description and the opening paragraph of one payload page, from the event registry's summary. */
function describeOperation(id: string) {
  const channel = document.channels[id] as { 'x-openwa-transport': Transport };
  const message = document.components.messages[id] as { name: string; summary: string; payload: { properties: Record<string, JsonObject> } };
  const transport = TRANSPORTS[channel['x-openwa-transport']];
  // "Fired when a new message is received" reads as "when a new message is received".
  const when = /^fired /i.test(message.summary) ? message.summary.replace(/^fired /i, '') : `for \`${message.name}\``;
  const envelope = Object.keys(message.payload.properties);
  const dataField = envelope.find((name) => message.payload.properties[name].$ref);
  const dataRef = dataField ? message.payload.properties[dataField].$ref! : undefined;
  const dataSchema = dataRef ? (document.components.schemas[dataRef.split('/').pop()!] as JsonObject) : undefined;
  const dataFields = Object.keys(dataSchema?.properties ?? {});
  return {
    description: `${transport.noun} open-wa ${transport.sends} ${when}: envelope, fields and an example.`,
    intro: [
      `open-wa ${transport.verb} ${when}.`,
      `${transport.envelope} ${code(envelope)}${dataField && dataFields.length > 0 ? `, and \`${dataField}\` carries ${code(dataFields)}` : ''}.`,
      `To set up delivery, see [${transport.guide.title}](${transport.guide.href}).`,
    ].join(' '),
  };
}

const operations = new Map(Object.keys(document.operations).map((id) => [id, describeOperation(id)]));
const operationByTitle = new Map(Object.entries(document.operations).map(([id, operation]) => [(operation as { summary: string }).summary, id]));

const output = fileURLToPath(new URL('content/docs/reference/event-contracts/generated/', app));
// This directory is generator-owned; removing it prevents stale event pages.
rmSync(output, { recursive: true, force: true });
await generateFiles({
  input: createAsyncAPI({ input: { openwa: document as AsyncAPI.AsyncAPIObject } }),
  output, per: 'operation', groupBy: 'none', includeDescription: false,
  // Pages stay at their operation-ID URLs; each gets its own search snippet.
  frontmatter: (title) => {
    const id = operationByTitle.get(title);
    return id ? { description: operations.get(id)!.description } : {};
  },
});
// The payload component renders in the browser, so the opening paragraph puts
// the event, its fields and the setup guide in the page's own HTML.
for (const [id, { intro }] of operations) {
  const file = `${output}/${id}.mdx`;
  const page = readFileSync(file, 'utf8');
  if (!page.includes('<AsyncAPIPage')) throw new Error(`${file} has no AsyncAPIPage to introduce.`);
  writeFileSync(file, page.replace('<AsyncAPIPage', `${intro}\n\n<AsyncAPIPage`));
}
writeFileSync(`${output}/meta.json`, `${JSON.stringify({ title: 'Payload reference', pages: Object.keys(document.operations) }, null, 2)}\n`);
console.log('Generated AsyncAPI reference pages and schema download');
