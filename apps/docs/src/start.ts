import { createMiddleware, createStart } from '@tanstack/react-start';
import { redirect } from '@tanstack/react-router';

const llmMiddleware = createMiddleware().server(({ next, request }) => {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/docs') && url.pathname.endsWith('.mdx')) {
    const newPath = `/llms.mdx${url.pathname.slice(0, -4)}`;
    throw redirect({ to: new URL(newPath, url).pathname });
  }

  return next();
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [llmMiddleware],
  };
});
