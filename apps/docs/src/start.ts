import { createMiddleware, createStart } from '@tanstack/react-start';
import { redirect } from '@tanstack/react-router';
import { source } from '@/lib/source';
import { llms } from 'fumadocs-core/source';
import { getLLMText } from '@/lib/get-llm-text';

const llmMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/docs') && url.pathname.endsWith('.mdx')) {
    const newPath = `/llms.mdx${url.pathname.slice(0, -4)}`;
    throw redirect({ to: new URL(newPath, url).pathname });
  }

  const acceptHeader = request.headers.get('Accept') || '';
  if (acceptHeader.includes('text/markdown')) {
    
    let markdownContent: string | null = null;
    
    try {
      if (url.pathname === '/') {
        markdownContent = llms(source).index();
      } else if (url.pathname.startsWith('/docs')) {
        const slugs = url.pathname.replace(/^\/docs\/?/, '').split('/').filter(Boolean);
        const page = source.getPage(slugs);
        if (page) {
          markdownContent = await getLLMText(page);
        }
      }
      
      if (markdownContent !== null) {
        const res = new Response(markdownContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Vary': 'Accept',
            'X-Markdown-Negotiation': 'Success',
          }
        });
        
        // Add required Link headers for agents
        res.headers.append('Link', '</.well-known/api-catalog>; rel="api-catalog"');
        res.headers.append('Link', '</.well-known/mcp/server-card.json>; rel="mcp-server"');
        res.headers.append('Link', '</.well-known/agent-skills/index.json>; rel="agent-skills"');
        
        return { response: res } as any;
      }
    } catch (err: any) {
      console.error('LLM Middleware Markdown Gen Error:', err);
    }
  }

  const result = await next();
  
  if (result && result.response && result.response instanceof Response) {
    const newHeaders = new Headers(result.response.headers);
    newHeaders.append('Link', '</.well-known/api-catalog>; rel="api-catalog"');
    newHeaders.append('Link', '</.well-known/mcp/server-card.json>; rel="mcp-server"');
    newHeaders.append('Link', '</.well-known/agent-skills/index.json>; rel="agent-skills"');
    newHeaders.append('Vary', 'Accept');
    
    // Attempt to reconstruct the response inside the result object
    result.response = new Response(result.response.body, {
      status: result.response.status,
      statusText: result.response.statusText,
      headers: newHeaders,
    });
  }

  return result;
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [llmMiddleware],
  };
});
