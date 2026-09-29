import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  redirect,
} from '@tanstack/react-router';
import * as React from 'react';
import appCss from '@/styles/app.css?url';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import SearchDialog from '@/components/search';
import { SITE_NAME } from '@/lib/site';
import { NotFound } from '@/components/not-found';
import { getLegacyDocsRedirect } from '@/lib/legacy-docs';
import { LicenseCheckoutProvider } from '@/components/license-checkout';

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const destination = getLegacyDocsRedirect(location.pathname);
    if (destination) {
      const hash = location.hash ? `#${location.hash.replace(/^#/, '')}` : '';
      throw redirect({ href: `${destination}${location.searchStr}${hash}`, statusCode: 301 });
    }
  },
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: SITE_NAME,
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'apple-touch-icon', href: '/wally.png' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof navigator !== 'undefined' && 'modelContext' in navigator) {
                // @ts-ignore
                navigator.modelContext.provideContext({
                  tools: [
                    {
                      name: "search_docs",
                      description: "Search open-wa developer documentation",
                      inputSchema: {
                        type: "object",
                        properties: {
                          query: { type: "string", description: "Search query" }
                        },
                        required: ["query"]
                      },
                      execute: async (args) => {
                        window.location.href = '/docs?search=' + encodeURIComponent(args.query);
                        return { result: "Redirected to search results." };
                      }
                    }
                  ]
                }).catch(console.error);
              }
            `,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider search={{ SearchDialog }}><LicenseCheckoutProvider>{children}</LicenseCheckoutProvider></RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
