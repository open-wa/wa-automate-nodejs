import { Link } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { baseOptions } from '@/lib/layout.shared';

const destinations = [
  { href: '/docs/getting-started/quickstart', title: 'Send your first message', description: 'Start and connect an Easy API session.' },
  { href: '/docs/reference/client/client', title: 'Client method reference', description: 'Find a method, its parameters and examples.' },
  { href: '/docs/guides/configuration-and-cli', title: 'Configuration and CLI', description: 'The current home for command-line options.' },
];

export function NotFound() {
  const { setOpenSearch } = useSearchContext();
  return (
    <HomeLayout {...baseOptions()} className="bg-background px-6 py-20">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <p className="text-sm font-medium text-muted-foreground">404 · Page not found</p>
        <h1 className="text-4xl font-semibold tracking-tight">Let’s find the right page.</h1>
        <p className="max-w-xl text-base leading-7 text-muted-foreground">
          This address does not match a current page. If you followed an older link,
          search for the method or topic, or try one of these starting points.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setOpenSearch(true)} className="min-h-11 rounded-lg bg-primary px-5 py-2 font-medium text-primary-foreground">
            Search documentation
          </button>
          <Link to="/docs/$" params={{ _splat: '' }} className="min-h-11 rounded-lg border px-5 py-2 font-medium">Documentation home</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {destinations.map(({ href, title, description }) => (
            <a key={href} href={href} className="rounded-xl border bg-card p-5 transition-colors hover:border-primary">
              <h2 className="font-semibold">{title} <span aria-hidden="true">→</span></h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </a>
          ))}
        </div>
      </main>
    </HomeLayout>
  );
}
