import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "OpenWA Dashboard",
      },
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

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="p-4 nav flex gap-4 border-b mb-4">
             <a href="/" className="font-bold">Home</a>
             <a href="/qr">QR Code</a>
             <a href="/chats">Chats</a>
             <a href="/events">Events</a>
        </div>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
