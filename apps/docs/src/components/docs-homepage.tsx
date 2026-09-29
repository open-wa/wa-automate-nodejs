import { ArrowRight, BookOpen, Code2, Link2, Server, ShieldCheck } from 'lucide-react';
import { CURRENT_VERSION, DOCS_PATHS } from '@/lib/site';
import { WorkbenchTexture } from './workbench-texture';

const paths = [
  { title: 'Run a local API', href: DOCS_PATHS.quickstart, icon: Server, description: 'Start the Easy API, link WhatsApp, and send your first message from any language.' },
  { title: 'Embed it in Node.js', href: DOCS_PATHS.customCode, icon: Code2, description: 'Create a session inside your application and handle messages in your own process.' },
  { title: 'Connect an existing API', href: DOCS_PATHS.socketClient, icon: Link2, description: 'Use SocketClient when your Node.js app talks to an Easy API running elsewhere.' },
];
const topics = [
  { title: 'Send and receive', links: [['Messages', DOCS_PATHS.messages], ['Images and files', DOCS_PATHS.media], ['Groups', DOCS_PATHS.groups], ['Events and webhooks', DOCS_PATHS.sessionEvents]] },
  { title: 'Connect applications', links: [['Integration guides', DOCS_PATHS.integrationsOverview], ['Chatwoot', DOCS_PATHS.chatwoot], ['SocketClient', DOCS_PATHS.socketClient], ['Cloudflare proxy', DOCS_PATHS.cloudflareProxy]] },
  { title: 'Run and maintain', links: [['Configuration and CLI', DOCS_PATHS.configuration], ['Multiple sessions', DOCS_PATHS.multiSession], ['How open-wa works', DOCS_PATHS.runtimeModel], ['Troubleshooting', DOCS_PATHS.errorHandling]] },
];

export function DocsHomepage() {
  return <div className="docs-hub">
    <header className="docs-hub-header">
      <div><h1>Build with open-wa</h1><p className="docs-hub-intro">Start by linking WhatsApp to your application. If you already have a session running, jump to the guides or look up a method.</p><p className="docs-hub-version"><a href="/docs/releases/v5-alpha">Documentation for v{CURRENT_VERSION}</a></p></div>
      <div className="docs-hub-wally" aria-hidden="true"><WorkbenchTexture /><img src="/mascots/wally-quickstart-transparent.png" alt="" width="180" height="180" /></div>
    </header>
    <section className="docs-hub-paths" aria-label="Start building">{paths.map(path => <a href={path.href} key={path.href}><path.icon size={23} /><h2>{path.title}</h2><p>{path.description}</p><ArrowRight size={18} aria-hidden="true" /></a>)}</section>
    <p className="docs-hub-reference"><BookOpen size={17} aria-hidden="true" /><span>Already have a session running?</span><a href={DOCS_PATHS.referenceClient}>Open the Client API reference <ArrowRight size={15} aria-hidden="true" /></a></p>
    <section className="docs-hub-topics" aria-label="Browse documentation">{topics.map(topic => <div key={topic.title}><h2>{topic.title}</h2>{topic.links.map(([label, href]) => <a key={href} href={href}>{label}<ArrowRight size={15} /></a>)}</div>)}</section>
    <aside className="docs-hub-license"><ShieldCheck size={24} /><div><h2>Choose a license for your application</h2><p>See which features need Restricted or Insiders access and what each requires before you buy.</p></div><a href={DOCS_PATHS.licensedFeatures} className="ow-license-foil">Compare features <ArrowRight size={16} /></a></aside>
  </div>;
}
