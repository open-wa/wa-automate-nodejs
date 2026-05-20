import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/.well-known/api-catalog')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      GET({ request }: { request: Request }) {
        const url = new URL(request.url);
        const origin = url.origin;
        
        // Return an API catalog matching the RFC 9727 / RFC 9264 linkset array format
        const catalog = {
          "linkset": [
            {
              "anchor": `${origin}/`,
              "service-desc": [
                { "href": `${origin}/openapi.json`, "type": "application/vnd.oai.openapi+json" }
              ],
              "service-doc": [
                { "href": `${origin}/docs/reference`, "type": "text/html" }
              ],
              "status": [
                { "href": `${origin}/api/healthCheck`, "type": "application/json" }
              ]
            }
          ]
        };
        
        return new Response(JSON.stringify(catalog, null, 2), {
          headers: {
            'Content-Type': 'application/linkset+json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      },
    },
  },
});
