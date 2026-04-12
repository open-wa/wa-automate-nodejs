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
  eyebrow?: string;
  badge?: 'insiders' | 'restricted';
};

const startPaths: LinkCard[] = [
  {
    title: 'Run the Easy API',
    href: DOCS_PATHS.easyApi,
    description:
      'Boot a WhatsApp API quickly, secure it with an API key, and move from first run to webhook or tunnel flows fast.',
    eyebrow: 'Fastest start',
  },
  {
    title: 'Embed open-wa in custom code',
    href: DOCS_PATHS.customCode,
    description:
      'Use create() directly in your own Node.js app when you want to own the client surface, listeners, and orchestration logic.',
    eyebrow: 'Library mode',
  },
  {
    title: 'Connect to a remote session',
    href: DOCS_PATHS.socketClient,
    description:
      'Use SocketClient when the runtime already lives somewhere else and your app only needs the remote consumer surface.',
    eyebrow: 'Remote consumer',
  },
];

const workflowCards: LinkCard[] = [
  {
    title: 'Understand the runtime model',
    href: DOCS_PATHS.runtimeModel,
    description:
      'See how browser automation, sessions, client control, Easy API, and remote consumers fit together in the new docs structure.',
    eyebrow: 'Concepts',
  },
  {
    title: 'Bootstrap auth and session events',
    href: DOCS_PATHS.sessionEvents,
    description:
      'Handle QR flows, link-code login, session data, and launch lifecycle events without hunting through legacy how-to sprawl.',
    eyebrow: 'Sessions',
  },
  {
    title: 'Scale to multiple sessions',
    href: DOCS_PATHS.multiSession,
    description:
      'Run more than one WhatsApp account deliberately with explicit session IDs and process-level orchestration.',
    eyebrow: 'Operations',
  },
  {
    title: 'Build messaging, media, and groups',
    href: DOCS_PATHS.messages,
    description:
      'Jump into the practical guides for message flows, media handling, decrypting files, and group automation.',
    eyebrow: 'Core workflows',
  },
  {
    title: 'Explore integrations and remote access',
    href: DOCS_PATHS.chatwoot,
    description:
      'The repo already carries real integration paths including Chatwoot, webhooks, S3, Node-RED, and Cloudflare proxying.',
    eyebrow: 'Integrations',
  },
  {
    title: 'Use the generated API reference',
    href: DOCS_PATHS.referenceClient,
    description:
      'Reference pages stay available for the full surface area, while onboarding and operations now live in clearer task-based sections.',
    eyebrow: 'Reference',
  },
];

const improvementCards: Array<{
  title: string;
  description: string;
}> = [
  {
    title: 'Three real entry paths instead of one generic homepage',
    description:
      'The new docs reflect the actual open-wa modes: library mode, Easy API mode, and remote-consumer mode.',
  },
  {
    title: 'Remote access is documented as a first-class workflow',
    description:
      'SocketClient now documents the active HTTP RPC + Server-Sent Events transport, and Cloudflare proxying gets its own guided path.',
  },
  {
    title: 'Licensing is separated from feature docs',
    description:
      'Licensed behavior now has explicit UX and operational guidance instead of being buried in scattered legacy marketing copy.',
  },
  {
    title: 'Docs are reorganized around tasks, not a flat legacy tree',
    description:
      'Getting Started, Guides, Integrations, Concepts, Operations, and Reference each have a clearer job in the new Fumadocs app.',
  },
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
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-fd-muted-foreground">
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

function Card({ card }: { card: LinkCard }) {
  return (
    <a
      href={card.href}
      className="group flex h-full flex-col rounded-3xl border border-fd-border bg-fd-card p-6 shadow-sm transition-colors hover:bg-fd-accent/60"
    >
      <div className="flex flex-wrap items-center gap-2">
        {card.eyebrow ? (
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-fd-muted-foreground">
            {card.eyebrow}
          </span>
        ) : null}
        {card.badge ? <LicenseBadge tier={card.badge} /> : null}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-fd-foreground group-hover:text-fd-primary">
        {card.title}
      </h3>
      <p className="mt-3 text-pretty text-sm leading-6 text-fd-muted-foreground sm:text-base">
        {card.description}
      </p>
      <span className="mt-6 text-sm font-medium text-fd-primary">
        Open page →
      </span>
    </a>
  );
}

export function DocsHomepage() {
  return (
    <HomeLayout
      {...baseOptions()}
      className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] lg:items-start">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-fd-muted-foreground">
            <span className="rounded-full border border-fd-border bg-fd-card px-3 py-1 font-medium">
              open-wa v5
            </span>
            <span>Current monorepo version: {CURRENT_VERSION}</span>
          </div>

          <div className="space-y-5">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-fd-foreground sm:text-5xl lg:text-6xl">
              The docs homepage open-wa needed for real first-time visitors.
            </h1>
            <p className="max-w-3xl text-pretty text-lg leading-8 text-fd-muted-foreground sm:text-xl">
              open-wa v5 gives you a few clear ways to automate WhatsApp: run the
              Easy API, embed the library in your own Node.js code, or connect to
              a remote session with SocketClient. This docs app brings those
              paths, integrations, operations guidance, generated reference, and
              licensed-feature availability into one maintained entry point.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={DOCS_PATHS.easyApi}
              className="inline-flex items-center justify-center rounded-full border border-fd-primary bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground hover:opacity-90"
            >
              Start with Easy API
            </a>
            <a
              href={DOCS_PATHS.overview}
              className="inline-flex items-center justify-center rounded-full border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-medium text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              Browse docs map
            </a>
            <GetLicenseButton />
          </div>

          <div className="flex flex-wrap gap-2 pt-2 text-sm text-fd-muted-foreground">
            <span className="rounded-full border border-fd-border px-3 py-1">
              Easy API
            </span>
            <span className="rounded-full border border-fd-border px-3 py-1">
              Custom code
            </span>
            <span className="rounded-full border border-fd-border px-3 py-1">
              SocketClient
            </span>
            <span className="rounded-full border border-fd-border px-3 py-1">
              Cloudflare proxy
            </span>
            <span className="rounded-full border border-fd-border px-3 py-1">
              Chatwoot / Node-RED / webhooks
            </span>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-fd-border bg-fd-card p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-fd-muted-foreground">
              What this site helps you do
            </p>
            <h2 className="text-2xl font-semibold text-fd-foreground">
              Choose a path, then go deeper without losing the reference surface.
            </h2>
          </div>
          <ul className="space-y-3 text-sm leading-6 text-fd-muted-foreground">
            <li>
              <strong className="text-fd-foreground">Ship fast:</strong> start a
              running API, add auth, and expose it safely.
            </li>
            <li>
              <strong className="text-fd-foreground">Build directly:</strong>{' '}
              use create(), listeners, and client methods in your own runtime.
            </li>
            <li>
              <strong className="text-fd-foreground">Consume remotely:</strong>{' '}
              connect dashboards, workers, and services to remote sessions.
            </li>
            <li>
              <strong className="text-fd-foreground">Operate deliberately:</strong>{' '}
              learn session events, multi-session coordination, and production
              recovery paths.
            </li>
          </ul>
          <LicensedFeatureCallout tier="restricted">
            Some flows are still license-gated. Keys are usually tied to the host
            account or runtime context you actually run, so the docs now keep the
            purchase path and the operational guidance visible together.
          </LicensedFeatureCallout>
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Start here"
          title="Pick the route that matches how you plan to use open-wa"
          description="The new homepage should tell newcomers what open-wa is, what it improves, and where to go next. These are the three most important first decisions."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {startPaths.map((card) => (
            <Card key={card.href} card={card} />
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Major workflows"
          title="From bootstrapping to operations, the docs are organized around real work"
          description="The legacy site mixed onboarding, reference, and scattered how-to pages together. The v5 Fumadocs app now points you toward the actual workflows most teams need."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {workflowCards.map((card) => (
            <Card key={card.href} card={card} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-[2rem] border border-fd-border bg-fd-card p-6 shadow-sm lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:p-8">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="What v5 improves"
            title="Better docs information architecture and clearer runtime guidance"
            description="This homepage stays grounded in the current repo: the docs tree is task-oriented, remote access uses the documented SocketClient transport, Cloudflare proxying is first-class, and licensing is explicit instead of hidden in generated pages."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {improvementCards.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-fd-border bg-fd-background p-5"
              >
                <h3 className="text-lg font-semibold text-fd-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-fd-border bg-fd-background p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-fd-muted-foreground">
            Legacy user?
          </p>
          <h3 className="text-2xl font-semibold text-fd-foreground">
            The migration path is clearer even though the sidebar is not a literal clone.
          </h3>
          <p className="text-sm leading-6 text-fd-muted-foreground">
            The new docs intentionally regroup content instead of mirroring the old
            Docusaurus tree one-to-one. Start with the docs overview, then use the
            workflow sections that match your runtime mode.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={DOCS_PATHS.overview}
              className="rounded-2xl border border-fd-border bg-fd-card px-4 py-3 text-sm font-medium text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              Open the docs overview
            </a>
            <a
              href={DOCS_PATHS.configuration}
              className="rounded-2xl border border-fd-border bg-fd-card px-4 py-3 text-sm font-medium text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              Review CLI and config guidance
            </a>
            <a
              href={DOCS_PATHS.licensedFeatures}
              className="rounded-2xl border border-fd-border bg-fd-card px-4 py-3 text-sm font-medium text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              Check licensed-feature availability
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-[2rem] border border-fd-border bg-fd-secondary/30 p-6 lg:grid-cols-[minmax(0,1.1fr)_auto] lg:items-center lg:p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-fd-muted-foreground">
            Licensing and availability
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-fd-foreground">
            Licensed features are visible now, not hidden behind legacy markdown tricks.
          </h2>
          <p className="max-w-3xl text-pretty text-base leading-7 text-fd-muted-foreground">
            Generated reference pages can show availability badges and licensed
            callouts, while the dedicated licensing docs explain how keys are
            supplied, how host-account context matters, and how to validate unlock
            behavior in the session you actually care about.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <a
            href={DOCS_PATHS.licensedFeatures}
            className="inline-flex items-center justify-center rounded-full border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-medium text-fd-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            Read licensing docs
          </a>
          <GetLicenseButton className="px-5 py-2.5" />
        </div>
      </section>
    </HomeLayout>
  );
}
