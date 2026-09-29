import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type ModelMessage,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import { source } from '@/lib/source';
import { Document, type DocumentData } from 'flexsearch';


interface CustomDocument extends DocumentData {
  url: string;
  title: string;
  description: string;
  content: string;
}

export type ChatUIMessage = UIMessage<
  never,
  {
    client: {
      location: string;
    };
  }
>;

async function createSearchServer() {
  const search = new Document<CustomDocument>({
    document: {
      id: 'url',
      index: ['title', 'description', 'content'],
      store: true,
    },
  });

  const docs = await chunkedAll(
    source.getPages().map(async (page) => {
      if (!('getText' in page.data)) return null;

      return {
        title: page.data.title,
        description: page.data.description,
        url: page.url,
        content: await page.data.getText('processed'),
      } as CustomDocument;
    }),
  );

  for (const doc of docs) {
    if (doc) search.add(doc);
  }

  return search;
}

async function chunkedAll<O>(promises: Promise<O>[]): Promise<O[]> {
  const SIZE = 50;
  const out: O[] = [];
  for (let i = 0; i < promises.length; i += SIZE) {
    out.push(...(await Promise.all(promises.slice(i, i + SIZE))));
  }
  return out;
}

const configuredApiKey = process.env.OPENROUTER_API_KEY?.trim();
const modelId = process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-5-mini';

function errorKind(error: unknown): string {
  return error instanceof Error ? error.name : 'UnknownError';
}

function createProvider() {
  if (!configuredApiKey) return null;

  try {
    return createOpenRouter({ apiKey: configuredApiKey });
  } catch (error) {
    console.error('AI_SEARCH_PROVIDER_INIT_ERROR', errorKind(error));
    return null;
  }
}

const openrouter = createProvider();
const model = (() => {
  if (!openrouter) return null;

  try {
    return openrouter.chat(modelId);
  } catch (error) {
    console.error('AI_SEARCH_MODEL_INIT_ERROR', errorKind(error));
    return null;
  }
})();

const searchServer = model
  ? createSearchServer()
  : Promise.resolve<Document<CustomDocument> | null>(null);

const UNAVAILABLE_MESSAGE = 'Ask AI is unavailable right now. Use docs search or the quick start guide instead.';

/** System prompt, you can update it to provide more specific information */
const systemPrompt = [
  'You are an AI assistant for a documentation site.',
  'Use the `search` tool to retrieve relevant docs context before answering when needed.',
  'The `search` tool returns raw JSON results from documentation. Use those results to ground your answer and cite sources as markdown links using the document `url` field when available.',
  'If you cannot find the answer in search results, say you do not know and suggest a better search query.',
].join('\n');

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          { available: model !== null },
          { headers: { 'Cache-Control': 'no-store' } },
        ),
      POST: async (ctx: any) => {
        if (!model) {
          console.warn('AI_SEARCH_UNAVAILABLE: OpenRouter is not configured');
          return Response.json(
            { error: UNAVAILABLE_MESSAGE },
            { status: 503 },
          );
        }

        const req = ctx.request;
        let modelMessages: ModelMessage[];

        try {
          const reqJson: unknown = await req.json();
          if (
            !reqJson ||
            typeof reqJson !== 'object' ||
            !('messages' in reqJson) ||
            !Array.isArray(reqJson.messages) ||
            reqJson.messages.length === 0
          ) {
            return Response.json(
              { error: 'Ask AI could not read that request. Try again or use docs search.' },
              { status: 400 },
            );
          }

          modelMessages = await convertToModelMessages<ChatUIMessage>(reqJson.messages, {
            convertDataPart(part) {
              if (part.type === 'data-client')
                return {
                  type: 'text',
                  text: `[Client Context: ${JSON.stringify(part.data)}]`,
                };
            },
          });
        } catch (error) {
          console.warn('AI_SEARCH_INVALID_REQUEST', errorKind(error));
          return Response.json(
            { error: 'Ask AI could not read that request. Try again or use docs search.' },
            { status: 400 },
          );
        }

        try {
          const result = streamText({
            model,
            stopWhen: stepCountIs(5),
            tools: {
              search: searchTool,
            },
            messages: [
              { role: 'system', content: systemPrompt },
              ...modelMessages,
            ],
            toolChoice: 'auto',
          });

          return result.toUIMessageStreamResponse({
            onError(error) {
              console.error('AI_SEARCH_ERROR', errorKind(error));
              return 'Ask AI is temporarily unavailable. Use docs search or the quick start guide instead.';
            },
          });
        } catch (error) {
          console.error('AI_SEARCH_SETUP_ERROR', errorKind(error));
          return Response.json(
            { error: UNAVAILABLE_MESSAGE },
            { status: 503 },
          );
        }
      },
    },
  },
});


export type SearchTool = typeof searchTool;

const searchTool = tool({
  description: 'Search the docs content and return raw JSON results.',
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(100).default(10),
  }),
  async execute({ query, limit }) {
    const search = await searchServer;
    if (!search) return [];
    return await search.searchAsync(query, { limit, merge: true, enrich: true });
  },
});
