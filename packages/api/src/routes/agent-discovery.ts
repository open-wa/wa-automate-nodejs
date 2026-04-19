import type { Config, HttpMethodDefinition } from '@open-wa/schema';

function getExternalBase(c: any) {
  return c.req.header('x-openwa-external-base') || '';
}

function joinPath(...parts: string[]) {
  const normalized = parts
    .filter(Boolean)
    .map((part, index) => {
      if (index === 0) {
        return part.replace(/\/+$/, '');
      }

      return part.replace(/^\/+/, '').replace(/\/+$/, '');
    })
    .filter(Boolean)
    .join('/');

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export function registerAgentDiscoveryRoutes(
  app: any,
  options: { config: Config; methodDefinitions: HttpMethodDefinition[] }
) {
  app.get('/robots.txt', (c: any) => {
    const origin = new URL(c.req.url).origin;
    const sitemapUrl = joinPath(origin, 'sitemap.xml');
    const content = `User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;
    // Add Content-Signal header for isitagentready check
    c.header('Content-Signal', 'ai-train=no, search=yes, ai-input=no');
    return c.text(content);
  });

  app.get('/sitemap.xml', (c: any) => {
    const origin = new URL(c.req.url).origin;
    const now = new Date().toISOString();
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/api-docs</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    c.header('Content-Type', 'application/xml');
    return c.text(content);
  });

  app.get('/.well-known/http-message-signatures-directory', (c: any) => {
    return c.json({ keys: [] });
  });

  app.get('/.well-known/api-catalog', (c: any) => {
    const origin = new URL(c.req.url).origin;
    c.header('Content-Type', 'application/linkset+json');
    return c.json({
      linkset: [
        {
          anchor: joinPath(origin, 'api'),
          'service-desc': [{ href: joinPath(origin, 'api-docs') }],
          status: [{ href: joinPath(origin, 'health') }],
        },
      ],
    });
  });

  app.get('/.well-known/oauth-authorization-server', (c: any) => {
    const origin = new URL(c.req.url).origin;
    return c.json({
      issuer: origin,
      authorization_endpoint: joinPath(origin, 'api'),
      token_endpoint: joinPath(origin, 'api'),
      grant_types_supported: ["client_credentials"],
      note: "Easy API uses X-API-Key headers strictly for authentication."
    });
  });

  app.get('/.well-known/openid-configuration', (c: any) => {
     // Alias for OAuth Auth Server
    const origin = new URL(c.req.url).origin;
    return c.json({
      issuer: origin,
      authorization_endpoint: joinPath(origin, 'api'),
      token_endpoint: joinPath(origin, 'api'),
      grant_types_supported: ["client_credentials"],
      note: "Easy API uses X-API-Key headers strictly for authentication."
    });
  });

  app.get('/.well-known/oauth-protected-resource', (c: any) => {
    const origin = new URL(c.req.url).origin;
    return c.json({
      resource: joinPath(origin, 'api'),
      authorization_servers: [origin],
      scopes_supported: ["all"],
    });
  });

  app.get('/.well-known/mcp/server-card.json', (c: any) => {
    const endpoint = options.config.mcp?.path || '/mcp';
    return c.json({
      serverInfo: { name: "open-wa", version: "5.0.0" },
      transport: { type: "sse", endpoint },
      capabilities: {}
    });
  });

  app.get('/.well-known/agent-card.json', (c: any) => {
    return c.json({
      name: "open-wa-bot",
      version: "5.0.0",
      supportedInterfaces: ["mcp"]
    });
  });

  app.get('/.well-known/agent-skills/index.json', (c: any) => {
    const origin = new URL(c.req.url).origin;
    return c.json({
      $schema: "https://agentskills.io/schema.json",
      skills: [
        {
          name: "check-health",
          type: "rest",
          description: "Check session health",
          url: joinPath(origin, 'health'),
          digest: "sha256-dummy",
        }
      ]
    });
  });
}
