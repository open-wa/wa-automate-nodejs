import { createFileRoute } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { GrowthMetricsPreference } from '@/components/growth-metrics-preference';
import { recordGrowthEvent } from '@/lib/growth-metrics';
import { baseOptions } from '@/lib/layout.shared';
import { getAbsoluteDocsUrl, getDocsSocialMeta, getPageImage } from '@/lib/og';
import { DOCS_PATHS, REPO_URL } from '@/lib/site';

const path = DOCS_PATHS.whatsappWebApi;
const title = 'WhatsApp Web API';
const description = 'Compare self-hosted WhatsApp Web APIs and Node.js libraries with Meta’s WhatsApp Business Platform. See how setup, inbound messages and licensing differ.';
const release = `${REPO_URL}/blob/v5.10.0`;

export const Route = createFileRoute('/whatsapp-web-api')({
  head: () => ({
    links: [{ rel: 'canonical', href: getAbsoluteDocsUrl(path) }],
    meta: getDocsSocialMeta({
      title: `${title} comparison and setup guide | open-wa`,
      description,
      url: getAbsoluteDocsUrl(path),
      imageUrl: getAbsoluteDocsUrl(getPageImage([]).url),
    }),
  }),
  component: WhatsAppWebApi,
});

const linkStyle = 'font-medium text-fd-primary underline underline-offset-4';

const openWaOptions = [
  {
    name: 'Easy API',
    setup: <>Generate an Easy API project, set an API key and scan the QR code. Run the HTTP server on your own Node.js host and call it from any language. <a href={DOCS_PATHS.easyApi}>Easy API quick start</a></>,
    events: <>Read <code>message.received</code> over Server-Sent Events or configure the webhook plugin to receive HTTP POSTs. <a href={DOCS_PATHS.receiveMessages}>Receive messages</a> · <a href={DOCS_PATHS.webhooks}>Webhook setup</a> · <a href={`${release}/packages/api/src/createApiServer.ts#L436`}>Released event endpoint</a></>,
    license: <>Receive messages and send text in existing chats without a feature key. Starting a chat with a new number requires a Restricted or Premium feature key for the linked number. <a href={DOCS_PATHS.licensedFeatures}>Licensed features</a> · <a href={`${release}/packages/client/src/methods/messaging.ts#L110`}>Released send code</a></>,
  },
  {
    name: 'Node.js SDK',
    setup: <>Generate an SDK project and scan the terminal QR code. Your Node.js app runs the WhatsApp session and manages its lifecycle. <a href={DOCS_PATHS.customCode}>SDK quick start</a> · <a href={`${release}/packages/wa-automate/src/index.ts`}>Released SDK exports</a></>,
    events: <>Handle incoming messages in your app with <code>client.onMessage</code>. <a href={`${release}/apps/docs/content/docs/getting-started/custom-code.mdx#L39`}>Released SDK example</a></>,
    license: <>The same feature-key boundary applies to the linked number. A basic receive-and-reply flow works without a key. <a href={DOCS_PATHS.licensedFeatures}>Licensed features</a></>,
  },
];

const alternatives = [
  {
    name: 'WAHA',
    setup: <>Run the <code>devlikeapro/waha</code> Docker image on your own host, start a session and scan its QR code. <a href="https://waha.devlike.pro/docs/overview/quick-start/">WAHA quick start</a></>,
    events: <>Configure a session webhook and subscribe to <code>message</code> for incoming messages. <a href="https://waha.devlike.pro/docs/how-to/events/#session-webhooks">WAHA webhooks</a></>,
    license: <>Core uses Apache 2.0. Since 2026.6.1, the former Plus features ship in Core. <a href="https://github.com/devlikeapro/waha/blob/core/LICENSE">Core license</a> · <a href="https://waha.devlike.pro/docs/how-to/waha-plus/">Core and Plus history</a></>,
  },
  {
    name: 'whatsapp-web.js',
    setup: <>Install the library in your Node.js app and scan its QR code. Your host runs the app and its Puppeteer browser. <a href="https://github.com/wwebjs/whatsapp-web.js">Project README</a> · <a href="https://wwebjs.dev/guide/creating-your-bot/">Bot setup</a></>,
    events: <>Listen for the <code>message</code> event in your app. Add your own HTTP layer if another service needs a webhook. <a href="https://docs.wwebjs.dev/Client.html#event:message">Client events</a></>,
    license: <>The library uses Apache 2.0. <a href="https://github.com/wwebjs/whatsapp-web.js#license">Library license</a></>,
  },
  {
    name: 'open-wa.org',
    setup: <>This separate OpenWA project runs as a REST gateway on your own host. Its Docker quick start creates a session and links it by QR. <a href="https://docs.open-wa.org/getting-started/quick-start">Gateway quick start</a></>,
    events: <>Subscribe to <code>message.received</code> with a session webhook. Configure a secret to sign deliveries. <a href="https://docs.open-wa.org/guides/webhooks">Gateway webhooks</a></>,
    license: <>The gateway uses the MIT license. <a href="https://github.com/rmyndharis/OpenWA/blob/main/LICENSE">Gateway license</a></>,
  },
  {
    name: 'Meta’s WhatsApp Business Platform',
    setup: <>Set up a Meta business portfolio and app, register a business number and configure API access. Meta hosts the Cloud API and you run your integration. <a href="https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform/">Platform setup</a> · <a href="https://whatsappbusiness.com/trust-and-safety/">Cloud API hosting</a></>,
    events: <>Meta sends inbound messages and outgoing delivery statuses to your webhook endpoint. <a href="https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview">Meta webhooks</a></>,
    license: <>Get recipient opt-in, honor opt-outs and use approved templates to initiate conversations or message outside the 24-hour customer service window. <a href="https://whatsappbusiness.com/policy/">Business Messaging Policy</a> · <a href="https://www.whatsapp.com/legal/WhatsApp-Terms-for-WhatsApp-Business-Platform">Platform terms</a> · <a href="https://whatsappbusiness.com/products/platform-pricing/">Platform pricing</a></>,
  },
];

function Option({ option }: { option: (typeof openWaOptions)[number] }) {
  return (
    <section className="min-w-0 rounded-xl border bg-fd-card p-4 sm:p-5">
      <h3 className="text-lg font-semibold [overflow-wrap:anywhere]">{option.name}</h3>
      <dl className="mt-3 space-y-3 text-sm leading-relaxed [&_a]:text-fd-primary [&_a]:underline [&_a]:underline-offset-4 [&_code]:break-all">
        <div><dt className="font-semibold">Setup and hosting</dt><dd>{option.setup}</dd></div>
        <div><dt className="font-semibold">Inbound events</dt><dd>{option.events}</dd></div>
        <div><dt className="font-semibold">License and terms</dt><dd>{option.license}</dd></div>
      </dl>
    </section>
  );
}

function WhatsAppWebApi() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10 sm:px-8 sm:py-16">
        <header className="max-w-3xl space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="text-lg leading-relaxed text-fd-muted-foreground">
            Choose a self-hosted HTTP gateway if another app needs to call WhatsApp from any language, or a Node.js library if your app should own the session. For Meta’s official business messaging API, use the WhatsApp Business Platform.
          </p>
          <p className="text-sm text-fd-muted-foreground">
            Sources checked <time dateTime="2026-11-20">20 November 2026</time>. OpenWA source checked against <a className={linkStyle} href={`${REPO_URL}/releases/tag/v5.10.0`}>v5.10.0</a>.
          </p>
        </header>

        <section aria-labelledby="openwa" className="space-y-4">
          <h2 id="openwa" className="text-2xl font-semibold [overflow-wrap:anywhere]">OpenWA at openwa.dev (<code className="text-[0.85em]">@open-wa/wa-automate</code>)</h2>
          <p className="max-w-3xl leading-relaxed">
            Easy API and the Node.js SDK share the <a className={linkStyle} href={`${release}/LICENSE.md`}>Hippocratic + Do Not Harm 1.1 software license</a>, which sets use and redistribution conditions. Product feature keys are separate.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {openWaOptions.map((option) => <Option key={option.name} option={option} />)}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a className={linkStyle} href={DOCS_PATHS.easyApi} onClick={() => recordGrowthEvent({ event: 'guide_next_step_click', source: 'api_comparison', target: 'easy_api' })}>Set up Easy API</a>
            <a className={linkStyle} href={DOCS_PATHS.customCode} onClick={() => recordGrowthEvent({ event: 'guide_next_step_click', source: 'api_comparison', target: 'sdk' })}>Set up the Node.js SDK</a>
          </div>
        </section>

        <section aria-labelledby="alternatives" className="space-y-4">
          <h2 id="alternatives" className="text-2xl font-semibold">Other WhatsApp API options</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {alternatives.map((option) => <Option key={option.name} option={option} />)}
          </div>
        </section>

        <section aria-labelledby="linking" className="max-w-3xl space-y-3 leading-relaxed">
          <h2 id="linking" className="text-2xl font-semibold">QR linking and account restrictions</h2>
          <p>
            For a QR-based setup, open WhatsApp on the primary phone and go to <strong>Linked devices → Link a device</strong>. Scanning the QR authorizes the running software as a linked device on that existing account. You can revoke that access from Linked devices. Keep the QR code and saved session private. <a className={linkStyle} href="https://faq.whatsapp.com/378279804439436/">WhatsApp linked-device guidance</a>
          </p>
          <p>
            WhatsApp warns that unofficial linking can lead to a temporary or permanent ban. Its terms also restrict impermissible bulk and automated messaging. Software licenses and feature keys govern the tool. WhatsApp controls account access and can enforce its policies on the official Business Platform too. <a className={linkStyle} href="https://www.whatsapp.com/legal/terms-of-service">WhatsApp Terms</a> · <a className={linkStyle} href="https://whatsappbusiness.com/policy/#steps-to-take-if-your-account-is-suspended-or-terminated">Business account enforcement</a>
          </p>
        </section>
        <GrowthMetricsPreference />
      </main>
    </HomeLayout>
  );
}
