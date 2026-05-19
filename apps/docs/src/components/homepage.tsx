import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import {
  GetLicenseButton,
  LicenseBadge,
  LicensedFeatureCallout,
} from '@/components/licensing';
import { CURRENT_VERSION, DOCS_PATHS } from '@/lib/site';

type LinkCard = {
  title: string;
  href: string;
  description: string;
  eyebrow: string;
  detail?: string;
  badge?: 'insiders' | 'restricted';
};

const startPaths: LinkCard[] = [
  {
    title: 'Run the Easy API',
    href: DOCS_PATHS.easyApi,
    description: 'Start a local WhatsApp API, secure it, and verify the live docs surface.',
    eyebrow: 'Fastest path',
    detail: 'CLI runtime, API key, generated docs',
  },
  {
    title: 'Embed the runtime',
    href: DOCS_PATHS.customCode,
    description: 'Use open-wa in Node.js when you need direct lifecycle and listener control.',
    eyebrow: 'Library mode',
    detail: 'createClient, drivers, events',
  },
  {
    title: 'Connect remotely',
    href: DOCS_PATHS.socketClient,
    description: 'Consume an existing session from workers, dashboards, bots, or services.',
    eyebrow: 'Remote consumer',
    detail: 'SocketClient, RPC, SSE events',
  },
];

const workflowCards: LinkCard[] = [
  {
    title: 'Runtime model',
    href: DOCS_PATHS.runtimeModel,
    description: 'Map sessions, browser drivers, Easy API, embedded code, and remote consumers.',
    eyebrow: 'Architecture',
  },
  {
    title: 'Session events',
    href: DOCS_PATHS.sessionEvents,
    description: 'Handle QR auth, link-code login, readiness, logouts, and lifecycle signals.',
    eyebrow: 'Control loop',
  },
  {
    title: 'Multi-session ops',
    href: DOCS_PATHS.multiSession,
    description: 'Coordinate named accounts, process boundaries, and runtime recovery paths.',
    eyebrow: 'Operations',
  },
  {
    title: 'Messages and media',
    href: DOCS_PATHS.messages,
    description: 'Build message, media, group, and file flows from the task-based guides.',
    eyebrow: 'Core work',
  },
  {
    title: 'Integrations',
    href: DOCS_PATHS.chatwoot,
    description: 'Bridge WhatsApp into Chatwoot, webhooks, S3, Node-RED, and proxy workflows.',
    eyebrow: 'Connectors',
  },
  {
    title: 'Generated reference',
    href: DOCS_PATHS.referenceClient,
    description: 'Drop into the full method surface when you already know what you need.',
    eyebrow: 'Reference',
  },
];

const opsSignals = [
  ['Mode', 'API, library, remote'],
  ['Auth', 'QR, link code, session data'],
  ['Transport', 'HTTP RPC plus SSE'],
  ['Status', `v${CURRENT_VERSION}`],
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-fd-primary">
        {eyebrow}
      </p>
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-fd-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="text-pretty text-base leading-7 text-fd-muted-foreground sm:text-lg">
        {description}
      </p>
    </div>
  );
}

function RouteCard({ card, featured = false }: { card: LinkCard; featured?: boolean }) {
  return (
    <a
      href={card.href}
      className={[
        'group flex h-full min-h-52 flex-col rounded-3xl border p-6 shadow-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
        featured
          ? 'border-fd-primary/50 bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90'
          : 'border-fd-border bg-fd-card text-fd-card-foreground hover:border-fd-primary/60 hover:bg-fd-accent/70',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={[
            'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
            featured
              ? 'border-fd-primary-foreground/25 bg-fd-primary-foreground/10 text-fd-primary-foreground'
              : 'border-fd-border bg-fd-secondary text-fd-muted-foreground',
          ].join(' ')}
        >
          {card.eyebrow}
        </span>
        {card.badge ? <LicenseBadge tier={card.badge} /> : null}
      </div>
      <h3 className="mt-5 text-balance text-2xl font-semibold tracking-tight">
        {card.title}
      </h3>
      <p
        className={[
          'mt-3 text-pretty text-sm leading-6 sm:text-base',
          featured ? 'text-fd-primary-foreground/80' : 'text-fd-muted-foreground',
        ].join(' ')}
      >
        {card.description}
      </p>
      {card.detail ? (
        <p
          className={[
            'mt-5 border-t pt-4 text-xs font-semibold uppercase tracking-[0.14em]',
            featured
              ? 'border-fd-primary-foreground/20 text-fd-primary-foreground/75'
              : 'border-fd-border text-fd-primary',
          ].join(' ')}
        >
          {card.detail}
        </p>
      ) : null}
      <span
        className={[
          'mt-auto pt-6 text-sm font-semibold',
          featured ? 'text-fd-primary-foreground' : 'text-fd-primary',
        ].join(' ')}
      >
        Open guide -&gt;
      </span>
    </a>
  );
}

function WorkflowCard({ card }: { card: LinkCard }) {
  return (
    <a
      href={card.href}
      className="group flex min-h-44 flex-col rounded-2xl border border-fd-border bg-fd-card p-5 shadow-sm transition-colors hover:border-fd-primary/50 hover:bg-fd-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fd-primary">
        {card.eyebrow}
      </p>
      <h3 className="mt-4 text-balance text-xl font-semibold text-fd-foreground group-hover:text-fd-primary">
        {card.title}
      </h3>
      <p className="mt-3 text-pretty text-sm leading-6 text-fd-muted-foreground">
        {card.description}
      </p>
    </a>
  );
}

function OpsConsolePanel() {
  return (
    <div className="rounded-3xl border border-fd-border bg-fd-card p-4 shadow-sm sm:p-5">
      <div className="rounded-2xl border border-fd-border bg-fd-background p-4">
        <div className="flex items-center justify-between gap-3 border-b border-fd-border pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fd-primary">
              Session console
            </p>
            <p className="mt-1 text-sm text-fd-muted-foreground">open-wa docs command center</p>
          </div>
          <span className="rounded-full border border-fd-primary/40 bg-fd-primary/10 px-3 py-1 text-xs font-semibold text-fd-primary">
            online
          </span>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {opsSignals.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-fd-border bg-fd-secondary p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-fd-muted-foreground">
                {label}
              </dt>
              <dd className="mt-2 text-sm font-medium text-fd-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 rounded-2xl border border-fd-border bg-fd-card p-4 font-mono text-xs leading-6 text-fd-muted-foreground">
          <p><span className="text-fd-primary">$</span> npx @open-wa/wa-automate --port 8080 --api-key ***</p>
          <p><span className="text-fd-primary">ok</span> session ready, api docs mounted, events streaming</p>
        </div>
      </div>
    </div>
  );
}

export function DocsHomepage() {
  return (
    <HomeLayout
      {...baseOptions()}
      className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"
    >
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-fd-muted-foreground">
            <span className="rounded-full border border-fd-primary/40 bg-fd-primary/10 px-3 py-1 font-semibold text-fd-primary">
              open-wa v5 alpha
            </span>
            <span>Current package: {CURRENT_VERSION}</span>
          </div>

          <div className="space-y-5">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-fd-foreground sm:text-6xl lg:text-7xl">
              WhatsApp automation docs for operators who ship.
            </h1>
            <p className="max-w-3xl text-pretty text-lg leading-8 text-fd-muted-foreground sm:text-xl">
              Run a WhatsApp API, embed the runtime, or connect remote consumers
              with a docs surface built around sessions, transports, integrations,
              and recovery paths.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={DOCS_PATHS.easyApi}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-fd-primary bg-fd-primary px-6 py-3 text-sm font-semibold text-fd-primary-foreground transition-colors hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            >
              Start with Easy API
            </a>
            <a
              href={DOCS_PATHS.overview}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-fd-border bg-fd-card px-6 py-3 text-sm font-semibold text-fd-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            >
              Browse docs map
            </a>
            <GetLicenseButton className="min-h-11 px-6 py-3" />
          </div>
        </div>

        <OpsConsolePanel />
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Choose your route"
          title="One obvious first move, then deeper control when you need it"
          description="The homepage now separates the three real entry paths so new users do not have to decode the full reference tree before running a session."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {startPaths.map((card, index) => (
            <RouteCard key={card.href} card={card} featured={index === 0} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-3xl border border-fd-border bg-fd-card p-5 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <SectionHeading
          eyebrow="Workflow grid"
          title="Docs organized around the work that keeps sessions alive"
          description="Use the task guides for setup, auth, multi-session operations, integrations, and recovery. Keep the generated reference for exact method lookup."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {workflowCards.map((card) => (
            <WorkflowCard key={card.href} card={card} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
        <div className="rounded-3xl border border-fd-border bg-fd-card p-6 shadow-sm sm:p-8">
          <SectionHeading
            eyebrow="Operations baseline"
            title="The important surfaces stay visible"
            description="Configuration, event readiness, proxying, AI tool access, generated schemas, and licensed-feature availability are treated as operating concerns, not buried footnotes."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href={DOCS_PATHS.configuration}
              className="rounded-2xl border border-fd-border bg-fd-background p-5 text-sm font-semibold text-fd-foreground transition-colors hover:border-fd-primary/50 hover:bg-fd-accent"
            >
              Configuration and CLI
            </a>
            <a
              href={DOCS_PATHS.cloudflareProxy}
              className="rounded-2xl border border-fd-border bg-fd-background p-5 text-sm font-semibold text-fd-foreground transition-colors hover:border-fd-primary/50 hover:bg-fd-accent"
            >
              Cloudflare session proxy
            </a>
            <a
              href={DOCS_PATHS.bestPractices}
              className="rounded-2xl border border-fd-border bg-fd-background p-5 text-sm font-semibold text-fd-foreground transition-colors hover:border-fd-primary/50 hover:bg-fd-accent"
            >
              Best practices
            </a>
            <a
              href={DOCS_PATHS.licensedFeatures}
              className="rounded-2xl border border-fd-border bg-fd-background p-5 text-sm font-semibold text-fd-foreground transition-colors hover:border-fd-primary/50 hover:bg-fd-accent"
            >
              Licensed features
            </a>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-fd-border bg-fd-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-fd-primary">
            License-aware docs
          </p>
          <h2 className="text-balance text-2xl font-semibold text-fd-foreground">
            Gated features are marked where decisions happen.
          </h2>
          <p className="text-pretty text-sm leading-6 text-fd-muted-foreground">
            Badges and callouts keep purchase paths and runtime context close to
            the feature guide, so teams can validate unlock behavior before they
            depend on it.
          </p>
          <LicensedFeatureCallout tier="restricted" className="bg-fd-background" />
        </div>
      </section>
    </HomeLayout>
  );
}
