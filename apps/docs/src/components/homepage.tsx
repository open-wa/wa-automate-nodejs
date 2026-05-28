import { HomeLayout } from 'fumadocs-ui/layouts/home';
import {
  NavbarMenu,
  NavbarMenuContent,
  NavbarMenuLink,
  NavbarMenuTrigger,
} from 'fumadocs-ui/layouts/home/navbar';
import {
  FullSearchTrigger,
  SearchTrigger,
  type FullSearchTriggerProps,
} from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { baseOptions } from '@/lib/layout.shared';
import { LicenseBadge, LicensedFeatureCallout } from '@/components/licensing';
import { CURRENT_VERSION, DOCS_PATHS } from '@/lib/site';

type LinkCard = {
  title: string;
  href: string;
  description: string;
  eyebrow: string;
  detail?: string;
  badge?: 'insiders' | 'restricted';
};

type MenuLinkItem = Extract<LinkItemType, { type: 'menu' }>['items'][number];
type CustomLinkItem = Extract<LinkItemType, { type: 'custom' }>;

function isHomepageLicenseLink(item: LinkItemType): item is CustomLinkItem {
  return item.type === 'custom' && item.secondary === true;
}

function renderHomeNavbarMenuLink(item: MenuLinkItem, index: number) {
  if (item.type === 'custom') {
    return <div key={index}>{item.children}</div>;
  }

  return (
    <NavbarMenuLink
      key={`${index}-${item.url}`}
      href={item.url}
      external={item.external}
    >
      <span className="text-base font-medium">{item.text}</span>
      {item.description ? (
        <span className="text-sm text-fd-muted-foreground">
          {item.description}
        </span>
      ) : null}
    </NavbarMenuLink>
  );
}

function createHomeNavbarMenu(
  item: Extract<LinkItemType, { type: 'menu' }>,
): LinkItemType {
  return {
    type: 'custom',
    on: 'nav',
    secondary: item.secondary,
    children: (
      <NavbarMenu>
        <NavbarMenuTrigger>{item.text}</NavbarMenuTrigger>
        <NavbarMenuContent>
          {item.items.map(renderHomeNavbarMenuLink)}
        </NavbarMenuContent>
      </NavbarMenu>
    ),
  };
}

function createHomeLayoutLinks(links: LinkItemType[] = []): LinkItemType[] {
  return links.flatMap((item) => {
    if (isHomepageLicenseLink(item)) return [{ ...item, on: 'menu' }];
    if (item.type !== 'menu') return [item];

    return [createHomeNavbarMenu(item), { ...item, on: 'menu' }];
  });
}

function createHomeSearchTrigger(licenseAction?: CustomLinkItem['children']) {
  return {
    sm: SearchTrigger,
    full: function HomeSearchTrigger(props: FullSearchTriggerProps) {
      return (
        <>
          {licenseAction}
          <FullSearchTrigger {...props} />
        </>
      );
    },
  };
}

const startPaths: LinkCard[] = [
  {
    title: 'Run the Easy API',
    href: DOCS_PATHS.quickstart,
    description:
      'Start the API, authenticate WhatsApp, open the live docs, and send one test message.',
    eyebrow: 'Fastest path',
    detail: 'CLI runtime, API key, generated docs',
  },
  {
    title: 'Embed the runtime',
    href: DOCS_PATHS.customCode,
    description:
      'Use createClient in Node.js when your app must own the session lifecycle.',
    eyebrow: 'Library mode',
    detail: 'createClient, drivers, events',
  },
  {
    title: 'Connect remotely',
    href: DOCS_PATHS.socketClient,
    description:
      'Connect a worker, dashboard, bot, or service to an Easy API session.',
    eyebrow: 'Remote consumer',
    detail: 'SocketClient, RPC, SSE events',
  },
];

const workflowCards: LinkCard[] = [
  {
    title: 'Runtime model',
    href: DOCS_PATHS.runtimeModel,
    description:
      'See which process owns the browser, API, events, and consumers.',
    eyebrow: 'Pick ownership',
  },
  {
    title: 'Session events',
    href: DOCS_PATHS.sessionEvents,
    description:
      'Handle QR auth, link-code login, readiness, logouts, and lifecycle signals.',
    eyebrow: 'Stay ready',
  },
  {
    title: 'Multi-session ops',
    href: DOCS_PATHS.multiSession,
    description:
      'Run named accounts with clear ports, process boundaries, and recovery paths.',
    eyebrow: 'Operations',
  },
  {
    title: 'Messages and media',
    href: DOCS_PATHS.messages,
    description:
      'Build message, media, group, and file flows from the task-based guides.',
    eyebrow: 'Core work',
  },
  {
    title: 'Integrations',
    href: DOCS_PATHS.chatwoot,
    description:
      'Send WhatsApp events into Chatwoot, webhooks, S3, Node-RED, or a proxy.',
    eyebrow: 'Connectors',
  },
  {
    title: 'Find an exact method',
    href: DOCS_PATHS.referenceClient,
    description:
      'Look up exact methods after you know the task you want to run.',
    eyebrow: 'API lookup',
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
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-display">
        {title}
      </h2>
      <p className="text-pretty text-base leading-7 text-muted-foreground sm:text-lg font-medium">
        {description}
      </p>
    </div>
  );
}

function RouteCard({
  card,
  featured = false,
}: {
  card: LinkCard;
  featured?: boolean;
}) {
  return (
    <a
      href={card.href}
      className={[
        'group flex h-full min-h-52 flex-col rounded-3xl border-backstitch p-6 shadow-stipple hover-stipple transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        featured
          ? 'bg-primary text-primary-foreground'
          : 'bg-card text-card-foreground',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={[
            'rounded-xl border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em]',
            featured
              ? 'border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground'
              : 'border-foreground bg-secondary text-secondary-foreground shadow-sm',
          ].join(' ')}
        >
          {card.eyebrow}
        </span>
        {card.badge ? <LicenseBadge tier={card.badge} /> : null}
      </div>
      <h3 className="mt-5 text-balance text-2xl font-bold tracking-tight font-display">
        {card.title}
      </h3>
      <p
        className={[
          'mt-3 text-pretty text-sm leading-6 sm:text-base font-medium',
          featured ? 'text-primary-foreground/80' : 'text-muted-foreground',
        ].join(' ')}
      >
        {card.description}
      </p>
      {card.detail ? (
        <p
          className={[
            'mt-5 border-t border-dashed pt-4 text-xs font-bold uppercase tracking-[0.14em]',
            featured
              ? 'border-primary-foreground/20 text-primary-foreground/75'
              : 'border-foreground text-primary',
          ].join(' ')}
        >
          {card.detail}
        </p>
      ) : null}
      <span
        className={[
          'mt-auto pt-6 text-sm font-bold',
          featured ? 'text-primary-foreground' : 'text-primary',
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
      className="group flex min-h-44 flex-col rounded-2xl border-backstitch bg-card p-5 shadow-sm hover-stipple transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
        {card.eyebrow}
      </p>
      <h3 className="mt-4 text-balance text-xl font-bold text-foreground group-hover:text-primary font-display">
        {card.title}
      </h3>
      <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground font-medium">
        {card.description}
      </p>
    </a>
  );
}

function WallyHeroIllustration() {
  return (
    <div className="relative mx-auto max-w-sm overflow-hidden rounded-3xl border-backstitch bg-card p-4 shadow-stipple lg:max-w-none">
      <div className="pointer-events-none absolute inset-0 bg-dither opacity-[0.14]" />
      <div className="pointer-events-none absolute right-5 top-5 size-14 rounded-full border-2 border-foreground bg-stitch-yellow/70" />
      <div className="pointer-events-none absolute bottom-5 left-5 size-12 rounded-full border-2 border-foreground bg-stitch-lavender/25" />
      <img
        src="/mascots/wally-homepage-session-console.png"
        alt="Wally the walrus typing at a retro developer desk"
        className="relative z-10 mx-auto h-auto w-full max-w-xs"
        loading="eager"
      />
      <div className="relative z-10 mt-4 rounded-2xl border-backstitch bg-background p-3 shadow-sm">
        <code className="block select-all overflow-x-auto whitespace-nowrap font-mono text-xs font-semibold leading-6 text-foreground sm:text-sm">
          npx @open-wa/wa-automate --port 8080 --api-key ***
        </code>
      </div>
    </div>
  );
}

export function DocsHomepage() {
  const layoutOptions = baseOptions();
  const licenseLink = layoutOptions.links?.find(isHomepageLicenseLink);
  const homeLayoutOptions = {
    ...layoutOptions,
    links: createHomeLayoutLinks(layoutOptions.links),
    slots: {
      ...layoutOptions.slots,
      searchTrigger: createHomeSearchTrigger(licenseLink?.children),
    },
  };

  return (
    <HomeLayout
      {...homeLayoutOptions}
      className="relative isolate mx-auto flex w-full max-w-7xl flex-col gap-14 overflow-hidden bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-dither opacity-[0.16]"
      />
      <section className="relative grid gap-8 overflow-hidden rounded-[2.25rem] border-4 border-foreground bg-background p-5 shadow-stipple ring-4 ring-primary/15 sm:p-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-dither opacity-[0.12]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 rounded-[1.75rem] border-2 border-foreground/20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 top-10 size-28 rounded-full border-4 border-foreground bg-stitch-yellow/60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 bottom-8 size-32 rounded-full border-4 border-foreground bg-stitch-lavender/20"
        />
        <div className="relative z-10 max-w-4xl space-y-7 text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground font-semibold lg:justify-start">
            <span className="rounded-xl border-backstitch bg-stitch-yellow/70 px-3 py-1 font-bold text-foreground shadow-sm">
              open-wa v5 alpha
            </span>
            <span>Current package: {CURRENT_VERSION}</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl font-display">
              Turn a WhatsApp account into an API you can build on.
            </h1>
            <p className="mx-auto max-w-3xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl font-medium lg:mx-0">
              Run the Easy API, link your phone, and send a first message in
              minutes. Then connect CRMs, AI agents, plugins, or your own
              Node.js app without rebuilding the WhatsApp Web runtime yourself.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
            <a
              href={DOCS_PATHS.quickstart}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border-backstitch bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover-stipple cursor-pointer shadow-sm"
            >
              Send your first message
            </a>
            <a
              href={DOCS_PATHS.overview}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border-backstitch bg-card px-6 py-3 text-sm font-bold text-foreground transition-all hover-stipple cursor-pointer shadow-sm"
            >
              Choose your path
            </a>
          </div>
        </div>

        <div className="relative z-10">
          <WallyHeroIllustration />
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Choose your route"
          title="Pick the path that matches your task"
          description="Start with the CLI when you need an API. Use custom code when your Node.js app owns the runtime. Use SocketClient when another process should consume an existing session."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {startPaths.map((card, index) => (
            <RouteCard key={card.href} card={card} featured={index === 0} />
          ))}
        </div>
      </section>

      <section className="relative grid gap-8 overflow-hidden rounded-[2rem] border-backstitch bg-card p-5 shadow-stipple sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="absolute inset-0 bg-dither opacity-[0.12] pointer-events-none" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-6 size-12 rounded-full border-2 border-foreground bg-stitch-lavender/20"
        />
        <div className="relative z-10">
          <SectionHeading
            eyebrow="Workflow grid"
            title="Use task guides before method lookup"
            description="Setup, auth, multi-session operations, integrations, and recovery have their own guides. Use the API lookup only when you need an exact method name or parameter."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 relative z-10">
          {workflowCards.map((card) => (
            <WorkflowCard key={card.href} card={card} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
        <div className="rounded-3xl border-backstitch bg-card p-6 shadow-stipple sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-dither opacity-[0.12] pointer-events-none" />
          <div className="relative z-10">
            <SectionHeading
              eyebrow="Production checklist"
              title="Check the parts that break first"
              description="Configuration, event readiness, proxying, AI access, generated schemas, and licensed features all affect whether a session works in production."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <a
                href={DOCS_PATHS.configuration}
                className="rounded-2xl border-backstitch bg-background p-5 text-sm font-bold text-foreground transition-all hover-stipple shadow-sm"
              >
                Configuration and CLI
              </a>
              <a
                href={DOCS_PATHS.cloudflareProxy}
                className="rounded-2xl border-backstitch bg-background p-5 text-sm font-bold text-foreground transition-all hover-stipple shadow-sm"
              >
                Cloudflare session proxy
              </a>
              <a
                href={DOCS_PATHS.bestPractices}
                className="rounded-2xl border-backstitch bg-background p-5 text-sm font-bold text-foreground transition-all hover-stipple shadow-sm"
              >
                Best practices
              </a>
              <a
                href={DOCS_PATHS.licensedFeatures}
                className="rounded-2xl border-backstitch bg-background p-5 text-sm font-bold text-foreground transition-all hover-stipple shadow-sm"
              >
                Licensed features
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border-backstitch bg-card p-6 shadow-stipple relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-dither opacity-[0.12] pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              License-aware docs
            </p>
            <h2 className="text-balance text-2xl font-bold text-foreground font-display">
              Gated features are marked before you depend on them.
            </h2>
            <p className="text-pretty text-sm leading-6 text-muted-foreground font-medium">
              Badges and callouts show license needs next to the feature guide,
              so teams can test unlock behavior before they build around it.
            </p>
          </div>
          <div className="relative z-10 mt-auto">
            <LicensedFeatureCallout
              tier="restricted"
              className="bg-background border-backstitch rounded-2xl p-4 shadow-sm"
            />
          </div>
        </div>
      </section>
    </HomeLayout>
  );
}
