import { env } from 'cloudflare:workers';
import { loader } from 'fumadocs-core/source';
import { z } from 'zod';

const entrySchema = z.object({
  id: z.string(), slug: z.string().min(1).max(200).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/),
  title: z.string(), description: z.string(), bodyMarkdown: z.string(),
  publishedAt: z.string().datetime().nullable(), updatedAt: z.string().datetime().nullable(),
  author: z.literal('open-wa'), image: z.string().nullable(), version: z.string().nullable(),
  audience: z.string().nullable(), highlights: z.array(z.string()),
  seo: z.object({title:z.string().nullish(), description:z.string().nullish(), canonical:z.string().nullish(), robots:z.string().nullish()}),
});
const feedSchema = z.object({entries:z.array(entrySchema),nextCursor:z.string().nullable()});
export type EditorialEntry = z.infer<typeof entrySchema>;
type EditorialBinding = {fetch(request: Request): Promise<Response>};

// Cloudflare service bindings are server-only. Forward no browser credentials,
// query filters, preview tokens, or user-controlled upstream URLs.
export async function getEditorialSource(collection: 'posts' | 'changelog') {
  const binding = (env as unknown as {OPENWA_CMS?: EditorialBinding}).OPENWA_CMS;
  if (!binding) throw new Error('Editorial content service is not configured');
  const entries: EditorialEntry[] = [];
  let cursor: string | null = null;
  const seen = new Set<string>();
  for (let page = 0; page < 100; page++) {
    const url = new URL(`https://cms.openwa.dev/api/published/${collection}`);
    if (cursor) url.searchParams.set('cursor', cursor);
    const response = await binding.fetch(new Request(url, {signal:AbortSignal.timeout(15000)}));
    if (!response.ok) throw new Error('Editorial content is temporarily unavailable');
    const feed = feedSchema.parse(await response.json());
    entries.push(...feed.entries);
    cursor = feed.nextCursor;
    if (!cursor) return loader({
      baseUrl: collection === 'posts' ? '/blog' : '/changelog',
      source: {files: entries.map(data => ({type:'page' as const,path:`${data.slug}.md`,slugs:[data.slug],data}))},
    });
    if (seen.has(cursor)) throw new Error('Editorial pagination did not advance');
    seen.add(cursor);
  }
  throw new Error('Editorial pagination limit exceeded');
}
