import { createFileRoute } from '@tanstack/react-router';
import { env } from 'cloudflare:workers';
import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import { getEditorialSource } from '@/lib/editorial.server';

const imageTypes = new Set(['image/png','image/jpeg','image/gif','image/webp','image/avif']);
export const Route = createFileRoute('/api/editorial-media/$')({server:{handlers:{async GET({params}) {
  const key = params._splat ?? '';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,500}$/.test(key) || key.split('/').some(part=>!part || part==='.' || part==='..')) return new Response('Not found',{status:404});
  const pathname = `/_emdash/api/media/file/${key}`;
  const sources = await Promise.all([getEditorialSource('posts'),getEditorialSource('changelog')]);
  let referenced = false;
  for (const source of sources) for (const page of source.getPages()) {
    visit(remark().parse(page.data.bodyMarkdown), 'image', node => {
      try {
        const url = new URL(node.url,'https://openwa.dev');
        if (['https://openwa.dev','https://cms.openwa.dev'].includes(url.origin) && url.pathname===pathname) referenced=true;
      } catch { /* Invalid image URLs are not public media references. */ }
    });
  }
  // A guessed upload key cannot expose a draft image or a CMS backup.
  if (!referenced) return new Response('Not found',{status:404});
  const binding = (env as unknown as {OPENWA_CMS:{fetch(request:Request):Promise<Response>}}).OPENWA_CMS;
  const response = await binding.fetch(new Request(`https://cms.openwa.dev${pathname}`,{signal:AbortSignal.timeout(15000)}));
  const contentType = response.headers.get('content-type')?.split(';')[0] ?? '';
  if (response.status!==200 || !imageTypes.has(contentType)) return new Response('Not found',{status:404});
  return new Response(response.body,{headers:{'Content-Type':contentType,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'",'Content-Disposition':'inline'}});
}}}});
