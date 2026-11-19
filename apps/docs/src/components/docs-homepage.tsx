import { useState } from 'react';
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  Check,
  Copy,
  Headset,
  Inbox,
  Rocket,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { CURRENT_VERSION, DOCS_PATHS } from '@/lib/site';
import { WorkbenchTexture } from './workbench-texture';

const CREATE_COMMAND = 'npm init @open-wa@latest my-bot';

const jobs = [
  { title: 'Send an OTP', href: DOCS_PATHS.sendOtp, icon: BellRing, description: 'Send one-time codes to a WhatsApp number and check they arrived.' },
  { title: 'Confirm a booking', href: DOCS_PATHS.bookingConfirmation, icon: CalendarCheck, description: 'Send a booking confirmation with buttons customers tap to confirm or change.' },
  { title: 'Run a support bot', href: DOCS_PATHS.supportBot, icon: Headset, description: 'Answer common questions automatically and hand the rest to a person.' },
  { title: 'Receive messages', href: DOCS_PATHS.receiveMessages, icon: Inbox, description: 'Handle incoming messages with onMessage, the event stream or a webhook.' },
  { title: 'Build a bot in Python', href: DOCS_PATHS.whatsappBotPython, icon: Terminal, description: 'Drive the Easy API from Python with ordinary HTTP requests.' },
  { title: 'Go to production', href: DOCS_PATHS.goToProduction, icon: Rocket, description: 'Run it in Docker, lock down the API and keep sessions healthy.' },
];

const lookups: Array<[string, string]> = [
  ['API reference', DOCS_PATHS.referenceClient],
  ['Send messages', DOCS_PATHS.sendMessage],
  ['Receive webhooks', DOCS_PATHS.webhooks],
  ['Sessions and login', DOCS_PATHS.sessions],
  ['Integrations', DOCS_PATHS.integrations],
  ['Configuration and CLI', DOCS_PATHS.configuration],
];

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="docs-hub-command">
      <code>
        <span aria-hidden="true">$ </span>
        {command}
      </code>
      <button
        type="button"
        aria-label={copied ? 'Copied' : 'Copy command'}
        onClick={() => {
          void navigator.clipboard?.writeText(command).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  );
}

export function DocsHomepage() {
  return (
    <div className="docs-hub">
      <header className="docs-hub-header">
        <div className="docs-hub-lead">
          <h1>WhatsApp API documentation</h1>
          <p className="docs-hub-intro">
            open-wa runs WhatsApp on your own server and gives you an HTTP API and a Node.js SDK. One command
            creates a project, starts the API and shows a QR code to link your phone.
          </p>
          <CopyCommand command={CREATE_COMMAND} />
          <p className="docs-hub-next">
            <a href={DOCS_PATHS.quickstart}>
              Walk through the quick start <ArrowRight size={15} aria-hidden="true" />
            </a>
            <a href={DOCS_PATHS.releases} className="docs-hub-version">
              v{CURRENT_VERSION}
            </a>
          </p>
        </div>
        <div className="docs-hub-wally" aria-hidden="true">
          <WorkbenchTexture />
          <img src="/mascots/wally-quickstart-transparent.png" alt="" width="180" height="180" />
        </div>
      </header>

      <section className="docs-hub-jobs" aria-labelledby="docs-hub-jobs-title">
        <h2 id="docs-hub-jobs-title">What do you want to build?</h2>
        <div className="docs-hub-job-grid">
          {jobs.map((job) => (
            <a href={job.href} key={job.href}>
              <job.icon size={20} aria-hidden="true" />
              <h3>{job.title}</h3>
              <p>{job.description}</p>
            </a>
          ))}
        </div>
        <p className="docs-hub-choice">
          Prefer HTTP or Node.js? Call the <a href={DOCS_PATHS.easyApi}>Easy API</a> from any language, or use the{' '}
          <a href={DOCS_PATHS.customCode}>SDK</a> inside your Node.js app.
        </p>
      </section>

      <nav className="docs-hub-lookups" aria-label="Look something up">
        {lookups.map(([label, href]) => (
          <a key={href} href={href}>
            {label}
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        ))}
      </nav>

      <aside className="docs-hub-license">
        <ShieldCheck size={22} aria-hidden="true" />
        <div>
          <h2>Some features need a license</h2>
          <p>Interactive messages and some other methods need a Restricted or Insiders key. See what each tier unlocks and what it costs.</p>
        </div>
        <a href={DOCS_PATHS.pricing}>
          See pricing <ArrowRight size={16} aria-hidden="true" />
        </a>
      </aside>
    </div>
  );
}
