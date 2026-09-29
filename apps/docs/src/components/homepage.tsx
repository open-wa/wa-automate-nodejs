import { useEffect, useRef, useState } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { ArrowRight, BookOpen, Check, Code2, Copy, Link2, MessageSquare, Server, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkbenchTexture } from '@/components/workbench-texture';
import { baseOptions } from '@/lib/layout.shared';
import { CURRENT_VERSION, DOCS_PATHS, REPO_URL } from '@/lib/site';

const runCommand = `npx @open-wa/wa-automate@${CURRENT_VERSION}`;
const examples = {
  HTTP: `curl -X POST http://localhost:8080/api/messages/sendText \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "to": "447123456789@c.us",\n    "content": "Your order is ready to collect!",\n    "options": {}\n  }'`,
  'Node.js': `await client.sendText(\n  '447123456789@c.us',\n  'Your order is ready to collect!'\n);`,
};

function CopyButton({ value, label = 'Copy code' }: { value: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return <Button type="button" variant="ghost" className="landing-copy" aria-label={label} onClick={async () => {
    try { await navigator.clipboard.writeText(value); setState('copied'); }
    catch { setState('failed'); }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2000);
  }}>
    {state === 'copied' ? <Check size={15} /> : <Copy size={15} />}
    <span aria-live="polite">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Select to copy' : 'Copy'}</span>
  </Button>;
}

function MessageExample() {
  const [mode, setMode] = useState<keyof typeof examples>('HTTP');
  return <div className="landing-example">
    <div className="landing-example-art" aria-hidden="true"><WorkbenchTexture /><img src="/mascots/wally-quickstart-transparent.png" width="230" height="230" alt="" /></div>
    <div className="landing-code">
      <div className="landing-code-toolbar">
        <div className="landing-example-switch" role="group" aria-label="Example language">
          {(Object.keys(examples) as Array<keyof typeof examples>).map(language => <button type="button" key={language} aria-pressed={mode === language} onClick={() => setMode(language)}>{language}</button>)}
        </div>
        <CopyButton value={examples[mode]} />
      </div>
      <div className="landing-code-body">
        <p>{mode === 'HTTP' ? <>After <a href={`${DOCS_PATHS.quickstart}#2-authenticate-the-session`}>linking your account</a> and <a href={`${DOCS_PATHS.quickstart}#3-check-readiness`}>checking it is ready</a>, call <a href={`${DOCS_PATHS.referenceClient}#sendtext`}><code>sendText</code></a> from a second terminal.</> : <>First <a href={DOCS_PATHS.customCode}>create a connected Client</a> in your Node.js app, then call <a href={`${DOCS_PATHS.referenceClient}#sendtext`}><code>sendText</code></a>.</>}</p>
        <p className="landing-example-instructions">Replace <code>447123456789@c.us</code> with a known recipient’s <a href="/docs/guides/chatid-primer#phone-numbers-and-direct-contact-ids">international number followed by @c.us</a>, without a + sign or spaces. Change the message to your own text.</p>
        <pre><code>{examples[mode]}</code></pre>
      </div>
      <div className="landing-example-result"><MessageSquare size={21} /><div><span>Message illustration</span><p>Your order is ready to collect!</p></div></div>
      <div className="landing-example-footer"><span>Follow the setup guide before sending your first message.</span><a href={DOCS_PATHS.quickstart}>Send your first message <ArrowRight size={14} /></a></div>
    </div>
  </div>;
}

const guideGroups = [
  { title: 'Send messages and files', icon: MessageSquare, description: 'Send an update, share a document, or reply when a message arrives.', links: [['Send a message', DOCS_PATHS.messages], ['Send images and files', DOCS_PATHS.media], ['Explore Client methods', DOCS_PATHS.referenceClient]] },
  { title: 'Connect your tools', icon: Zap, description: 'Pass incoming messages to your application or bring conversations into your helpdesk.', links: [['Handle incoming events', DOCS_PATHS.sessionEvents], ['Receive webhooks', '/docs/guides/webhooks-for-business'], ['Connect Chatwoot', DOCS_PATHS.chatwoot]] },
  { title: 'Manage your sessions', icon: Server, description: 'Run more than one account, adjust settings, and work through connection problems.', links: [['Run multiple accounts', DOCS_PATHS.multiSession], ['Configure your runtime', DOCS_PATHS.configuration], ['Troubleshoot a session', DOCS_PATHS.errorHandling]] },
];

export function DocsHomepage() {
  return <HomeLayout {...baseOptions()} className="landing-layout">
    <main className="landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <h1 id="landing-title">Connect WhatsApp<br />to your<br /><span>application.</span></h1>
          <p className="landing-lead">Send order updates, reply to incoming messages, and connect WhatsApp to the tools you already use. open-wa runs on your own computer or server.</p>
          <p className="landing-requirements">You’ll need <a href={`${DOCS_PATHS.quickstart}#prerequisites`}>Node.js 22.21.1 or newer</a> and a phone with WhatsApp.</p>
          <ol className="landing-steps" aria-label="Get started"><li><span>1</span> Start open-wa</li><li><span>2</span> Link WhatsApp</li><li><span>3</span> Send a message</li></ol>
          <p className="landing-command-label">Start the <a href={DOCS_PATHS.easyApi}>Easy API</a>, open-wa’s HTTP server, in your terminal:</p>
          <div className="landing-command"><span aria-hidden="true">$</span><code>{runCommand}</code><CopyButton value={runCommand} label="Copy run command" /></div>
          <div className="landing-actions"><a className="landing-button landing-primary" href={DOCS_PATHS.quickstart}>Send your first message <ArrowRight size={17} /></a><a className="landing-button landing-secondary" href={DOCS_PATHS.referenceClient}>Explore the API</a></div>
          <p className="landing-setup-link">Once it’s running, <a href="http://localhost:8080/dashboard/" target="_blank" rel="noreferrer">open your local dashboard</a>. The <a href={DOCS_PATHS.quickstart}>quick start</a> walks you through linking WhatsApp and sending a message.</p>
        </div>
        <MessageExample />
      </section>
      <nav className="landing-shortcuts" aria-label="API shortcuts"><span>API shortcuts</span><a href={DOCS_PATHS.referenceClient}><BookOpen size={16} />Client API</a><a href={`${DOCS_PATHS.referenceClient}#sendtext`}><code>sendText</code></a><a href={`${DOCS_PATHS.referenceClient}#getallchats`}><code>getAllChats</code></a><a href={DOCS_PATHS.sessionEvents}>Events</a><a href={DOCS_PATHS.errorHandling}>Troubleshooting <ArrowRight size={15} /></a></nav>
      <section className="landing-section" aria-labelledby="run-heading"><h2 id="run-heading">Choose how open-wa fits your application</h2>
        <div className="landing-run-options"><a href={DOCS_PATHS.quickstart} className="landing-run-option"><div className="landing-option-label"><Server size={24} /></div><h3>Run a local API</h3><p>Start the Easy API as a separate process, link WhatsApp, and send requests from any language.</p><pre><code>{runCommand}</code></pre><span className="landing-arrow-link">Follow the quick start <ArrowRight size={16} /></span></a>
        <a href={DOCS_PATHS.customCode} className="landing-run-option"><div className="landing-option-label"><Code2 size={24} /></div><h3>Embed it in Node.js</h3><p>Create a WhatsApp session inside your Node.js or TypeScript app and handle events in your own process.</p><pre><code>{"import { createClient } from '@open-wa/wa-automate'"}</code></pre><span className="landing-arrow-link">Use the Node.js library <ArrowRight size={16} /></span></a>
        <a href={DOCS_PATHS.socketClient} className="landing-run-option"><div className="landing-option-label"><Link2 size={24} /></div><h3>Connect an existing API</h3><p>Use SocketClient when your application talks to an Easy API session already running on another host.</p><pre><code>{"import { SocketClient } from '@open-wa/socket-client'"}</code></pre><span className="landing-arrow-link">Connect with SocketClient <ArrowRight size={16} /></span></a></div>
      </section>
      <section className="landing-section" aria-labelledby="guides-heading"><div className="landing-section-heading"><h2 id="guides-heading">Build on your first message</h2><a className="landing-arrow-link" href={DOCS_PATHS.overview}>All documentation <ArrowRight size={16} /></a></div><div className="landing-guides">{guideGroups.map(group => <article key={group.title}><group.icon size={24} /><h3>{group.title}</h3><p>{group.description}</p><div>{group.links.map(([label,href]) => <a key={href} className="landing-arrow-link" href={href}>{label}<ArrowRight size={15} /></a>)}</div></article>)}</div></section>
      <section className="landing-license"><ShieldCheck size={30} /><div><h2>Choose a license for the features you need</h2><p>Check which features need Restricted or Insiders access, including their account requirements and current limitations, before you buy.</p></div><a className="landing-button ow-license-foil" href={DOCS_PATHS.licensedFeatures}>Compare licensed features <ArrowRight size={16} /></a></section>
      <footer className="landing-footer"><div><strong>open-wa</strong><span>WhatsApp automation on your own infrastructure. <a href="/docs/releases/v5-alpha">Version {CURRENT_VERSION}</a></span></div><nav aria-label="Footer"><a href={DOCS_PATHS.overview}>Documentation</a><a href={REPO_URL}>GitHub ↗</a><a href="https://discord.gg/dpan7EYE3t">Community ↗</a><a href={DOCS_PATHS.licensedFeatures}>Licensing</a></nav></footer>
    </main>
  </HomeLayout>;
}
