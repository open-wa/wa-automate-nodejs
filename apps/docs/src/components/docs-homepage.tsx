import { LicenseBadge } from '@/components/licensing';
import { CURRENT_VERSION, DOCS_PATHS } from '@/lib/site';
import { MascotCallout } from './mascot-callout';

type DocsHubCard = {
  title: string;
  href: string;
  description: string;
  eyebrow: string;
  tone?: 'primary' | 'muted';
};

const primaryCards: DocsHubCard[] = [
  {
    title: 'Quick start the Easy API',
    href: DOCS_PATHS.quickstart,
    description: 'Start a local WhatsApp API, authenticate, and verify the live docs surface.',
    eyebrow: 'Start here',
    tone: 'primary',
  },
  {
    title: 'Own the runtime in code',
    href: DOCS_PATHS.customCode,
    description: 'Use createClient when your app needs direct browser and session ownership.',
    eyebrow: 'Embedded mode',
  },
  {
    title: 'Connect a remote worker',
    href: DOCS_PATHS.socketClient,
    description: 'Consume an existing Easy API session from bots, dashboards, or services.',
    eyebrow: 'Socket client',
  },
];

const referenceCards: DocsHubCard[] = [
  {
    title: 'Runtime model',
    href: DOCS_PATHS.runtimeModel,
    description: 'Understand process ownership, transports, browser drivers, and consumers.',
    eyebrow: 'Concepts',
  },
  {
    title: 'Configuration and CLI',
    href: DOCS_PATHS.configuration,
    description: 'Set ports, API keys, sessions, auth timeouts, webhooks, and license keys.',
    eyebrow: 'Operate',
  },
  {
    title: 'Client API reference',
    href: DOCS_PATHS.referenceClient,
    description: 'Jump to exact methods after you know the task you want to automate.',
    eyebrow: 'Lookup',
  },
  {
    title: 'Integrations',
    href: DOCS_PATHS.chatwoot,
    description: 'Bridge events into Chatwoot, webhooks, S3, Node-RED, or Cloudflare.',
    eyebrow: 'Connectors',
  },
];

function HubCard({ card }: { card: DocsHubCard }) {
  const featured = card.tone === 'primary';

  return (
    <a
      href={card.href}
      className={[
        'group flex min-h-40 flex-col rounded-2xl border-backstitch p-5 shadow-sm transition-all hover-stipple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        featured ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground',
      ].join(' ')}
    >
      <p
        className={[
          'text-xs font-bold uppercase tracking-[0.14em]',
          featured ? 'text-primary-foreground/75' : 'text-primary',
        ].join(' ')}
      >
        {card.eyebrow}
      </p>
      <h2 className="mt-4 text-balance text-xl font-bold tracking-tight font-display">
        {card.title}
      </h2>
      <p
        className={[
          'mt-3 text-pretty text-sm leading-6 font-medium',
          featured ? 'text-primary-foreground/80' : 'text-muted-foreground',
        ].join(' ')}
      >
        {card.description}
      </p>
      <span
        className={[
          'mt-auto pt-5 text-sm font-bold',
          featured ? 'text-primary-foreground' : 'text-primary',
        ].join(' ')}
      >
        Open guide -&gt;
      </span>
    </a>
  );
}

export function DocsHomepage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8 lg:py-10">
      <section className="grid gap-6 rounded-3xl border-backstitch bg-card p-5 shadow-stipple md:p-7 lg:grid-cols-[minmax(0,1fr)_320px] relative overflow-hidden">
        <div className="absolute inset-0 bg-dither opacity-[0.08] pointer-events-none" />
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            <span className="rounded-xl border-backstitch bg-primary/10 px-3 py-1 text-foreground shadow-sm">
              Docs hub
            </span>
            <span>v{CURRENT_VERSION}</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground font-display md:text-5xl">
              Build from the right open-wa surface.
            </h1>
            <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground font-medium md:text-lg">
              Start with the running API, move into embedded runtime code when you need ownership,
              then use task guides before reaching for raw method lookup.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={DOCS_PATHS.quickstart}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border-backstitch bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover-stipple"
            >
              Start with Quick Start
            </a>
            <a
              href={DOCS_PATHS.referenceClient}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border-backstitch bg-background px-5 py-3 text-sm font-bold text-foreground shadow-sm transition-all hover-stipple"
            >
              Open API reference
            </a>
          </div>
        </div>
        <MascotCallout className="relative z-10 justify-center self-stretch" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {primaryCards.map((card) => (
          <HubCard key={card.href} card={card} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.38fr)]">
        <div className="rounded-3xl border-backstitch bg-card p-5 shadow-stipple md:p-7 relative overflow-hidden">
          <div className="absolute inset-0 bg-dither opacity-[0.06] pointer-events-none" />
          <div className="relative z-10 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Keep moving
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground font-display">
                Useful next stops
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {referenceCards.map((card) => (
                <HubCard key={card.href} card={card} />
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col justify-between gap-6 rounded-3xl border-backstitch bg-background p-5 shadow-stipple md:p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <LicenseBadge tier="restricted" />
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Heads up
              </span>
            </div>
            <h2 className="text-balance text-2xl font-bold text-foreground font-display">
              Licensed surfaces are marked before you build around them.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground font-medium">
              Guides call out gated flows such as host-account-specific capabilities,
              so teams can test unlock behavior before production work starts.
            </p>
          </div>
          <a
            href={DOCS_PATHS.licensedFeatures}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border-backstitch bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm transition-all hover-stipple"
          >
            Review licensed features
          </a>
        </aside>
      </section>
    </div>
  );
}
