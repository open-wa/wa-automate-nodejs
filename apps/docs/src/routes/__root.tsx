import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import * as React from 'react';
import appCss from '@/styles/app.css?url';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import SearchDialog from '@/components/search';
import { SITE_NAME } from '@/lib/site';

export const Route = createRootRoute({
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
      { rel: 'preload', href: '/fonts/AnalogMonoPlus.ttf', as: 'font', type: 'font/ttf', crossOrigin: 'anonymous' },
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
                      description: "Search openWA developer documentation",
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
        <RootProvider search={{ SearchDialog }}>{children}</RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
