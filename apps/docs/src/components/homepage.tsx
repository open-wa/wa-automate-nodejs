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
  bestFor?: string;
  timeToResult?: string;
  needs?: string;
  avoidWhen?: string;
  wrongPathSymptom?: string;
  blockedNextStep?: string;
};

type MenuLinkItem = Extract<LinkItemType, { type: 'menu' }>['items'][number];
type CustomLinkItem = Extract<LinkItemType, { type: 'custom' }>;

function isHomepageLicenseLink(item: LinkItemType): item is CustomLinkItem {
  return item.type === 'custom' && item.secondary === true;
}

function renderHomeNavbarMenuLink(item: MenuLinkItem, index: number) {
  if (item.type === 'custom') {
    return <div className='font-mono' key={index}>{item.children}</div>;
  }

  return (
    <NavbarMenuLink
      className='font-mono'
      key={`${index}-${item.url}`}
      href={item.url}
      external={item.external}
    >
      <span className="text-base font-medium font-mono">{item.text}</span>
      {item.description ? (
        <span className="text-sm text-fd-muted-foreground font-mono">
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
      <NavbarMenu className='font-mono bg-background'>
        <NavbarMenuTrigger className='font-mono'>{item.text}</NavbarMenuTrigger>
        <NavbarMenuContent>
          {item.items.map(renderHomeNavbarMenuLink)}
        </NavbarMenuContent>
      </NavbarMenu>
    ),
  };
}

function createHomeLayoutLinks(links: LinkItemType[] = []): LinkItemType[] {
  return links.filter(item => !(item as any).hideOnHomepage).flatMap((item) => {
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
          <FullSearchTrigger className='font-mono' {...props} />
          {licenseAction}
          <a href="https://discord.gg/dpan7EYE3t" target="_blank" rel="noopener noreferrer" className="w-5 h-5 m-2" title="Discord">
            <svg role="img" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <title>Discord</title>
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
            </svg>
          </a>
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
    bestFor: 'I need an API today',
    timeToResult: '5-10 minutes',
    needs: 'Phone login, API key, local port',
    avoidWhen: 'Your Node app must own browser lifecycle and driver choice.',
    wrongPathSymptom: 'Your app fights the API process for runtime ownership.',
    blockedNextStep: 'Check configuration, auth readiness, or the API Explorer.',
  },
  {
    title: 'Embed the runtime',
    href: DOCS_PATHS.customCode,
    description:
      'Use createClient in Node.js when your app must own the session lifecycle.',
    eyebrow: 'Library mode',
    detail: 'createClient, drivers, events',
    bestFor: 'I already have a Node.js app',
    timeToResult: 'Deep integration path',
    needs: 'createClient, browser driver, lifecycle handlers',
    avoidWhen: 'You only need a hosted API another service can call.',
    wrongPathSymptom: 'Setup stalls while you wire browser details you do not need.',
    blockedNextStep: 'Start with the runtime model before adding handlers.',
  },
  {
    title: 'Connect remotely',
    href: DOCS_PATHS.socketClient,
    description:
      'Connect a worker, dashboard, bot, or service to an Easy API session.',
    eyebrow: 'Remote consumer',
    detail: 'SocketClient, RPC, SSE events',
    bestFor: 'I already have a bot, worker, or CRM',
    timeToResult: 'After Easy API is running',
    needs: 'Running Easy API, API key, reachable URL',
    avoidWhen: 'No Easy API process owns the WhatsApp session yet.',
    wrongPathSymptom: 'The consumer connects but no session is ready.',
    blockedNextStep: 'Verify session events and API key configuration.',
  },
];

const setupStates = [
  'CLI running',
  'Node app',
  'Remote worker',
  'Multi-session fleet',
  'AI agent',
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
      <dl
        className={[
          'mt-5 grid gap-3 rounded-2xl border border-dashed p-4 text-left text-xs font-semibold leading-5',
          featured
            ? 'border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/85'
            : 'border-foreground/35 bg-background text-muted-foreground',
        ].join(' ')}
      >
        {card.bestFor ? (
          <div>
            <dt className={featured ? 'text-primary-foreground' : 'text-foreground'}>
              Best for
            </dt>
            <dd>{card.bestFor}</dd>
          </div>
        ) : null}
        {card.timeToResult ? (
          <div>
            <dt className={featured ? 'text-primary-foreground' : 'text-foreground'}>
              Time
            </dt>
            <dd>{card.timeToResult}</dd>
          </div>
        ) : null}
        {card.needs ? (
          <div>
            <dt className={featured ? 'text-primary-foreground' : 'text-foreground'}>
              You need
            </dt>
            <dd>{card.needs}</dd>
          </div>
        ) : null}
        {card.avoidWhen ? (
          <div>
            <dt className={featured ? 'text-primary-foreground' : 'text-foreground'}>
              Avoid if
            </dt>
            <dd>{card.avoidWhen}</dd>
          </div>
        ) : null}
        {card.wrongPathSymptom ? (
          <div>
            <dt className={featured ? 'text-primary-foreground' : 'text-foreground'}>
              Wrong path symptom
            </dt>
            <dd>{card.wrongPathSymptom}</dd>
          </div>
        ) : null}
        {card.blockedNextStep ? (
          <div>
            <dt className={featured ? 'text-primary-foreground' : 'text-foreground'}>
              Blocked?
            </dt>
            <dd>{card.blockedNextStep}</dd>
          </div>
        ) : null}
      </dl>
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
    <div className="relative mx-auto max-w-sm overflow-hidden rounded-3xl border-backstitch p-4 shadow-stipple lg:max-w-none">
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
    transparentMode: 'top',
    slots: {
      searchTrigger: createHomeSearchTrigger(licenseLink?.children),
      ...layoutOptions.slots,
    },
  };

  return (
    <HomeLayout
      {...homeLayoutOptions}
      className="font-mono relative isolate mx-auto flex w-full flex-col gap-14 overflow-hidden bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"
    >
      <div className="font-mono relative isolate mx-auto flex w-full flex-col gap-14 overflow-hidden bg-background max-w-7xl">
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
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              What are you trying to run?
            </p>
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
          <div className="rounded-2xl border-backstitch bg-card/85 p-4 text-left shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              I already have
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {setupStates.map((state) => (
                <span
                  key={state}
                  className="rounded-xl border border-foreground/35 bg-background px-3 py-1 text-xs font-bold text-foreground"
                >
                  {state}
                </span>
              ))}
            </div>
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
            eyebrow="After your first success"
            title="Use task guides before method lookup"
            description="Once the route works, move through session health, messages, integrations, multi-session operations, and recovery before using API lookup for exact method names."
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
                1. Configure runtime and API key
              </a>
              <a
                href={DOCS_PATHS.sessionEvents}
                className="rounded-2xl border-backstitch bg-background p-5 text-sm font-bold text-foreground transition-all hover-stipple shadow-sm"
              >
                2. Handle auth and session readiness
              </a>
              <a
                href={DOCS_PATHS.messages}
                className="rounded-2xl border-backstitch bg-background p-5 text-sm font-bold text-foreground transition-all hover-stipple shadow-sm"
              >
                3. Add event handling and message flows
              </a>
              <a
                href={DOCS_PATHS.cloudflareProxy}
                className="rounded-2xl border-backstitch bg-background p-5 text-sm font-bold text-foreground transition-all hover-stipple shadow-sm"
              >
                4. Check proxy and deployment setup
              </a>
              <a
                href={DOCS_PATHS.licensedFeatures}
                className="rounded-2xl border-backstitch bg-background p-5 text-sm font-bold text-foreground transition-all hover-stipple shadow-sm"
              >
                5. Confirm license-gated features
              </a>
              <a
                href={DOCS_PATHS.bestPractices}
                className="rounded-2xl border-backstitch bg-background p-5 text-sm font-bold text-foreground transition-all hover-stipple shadow-sm"
              >
                6. Add monitoring and recovery notes
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
      </div>
    </HomeLayout>
  );
}
