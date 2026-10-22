import { ArrowRight, BookOpen, Code2, Link2, Server, ShieldCheck } from 'lucide-react';
import { CURRENT_VERSION, DOCS_PATHS } from '@/lib/site';
import { WorkbenchTexture } from './workbench-texture';

const paths = [
  { title: 'Run a local API', href: DOCS_PATHS.quickstart, icon: Server, description: 'Start the Easy API, link WhatsApp, and send your first message from any language.' },
  { title: 'Embed it in Node.js', href: DOCS_PATHS.customCode, icon: Code2, description: 'Create a session inside your application and handle messages in your own process.' },
  { title: 'Connect an existing API', href: DOCS_PATHS.socketClient, icon: Link2, description: 'Use SocketClient when your Node.js app talks to an Easy API running elsewhere.' },
];
const topics = [
  { title: 'Send and receive', description: 'Send text, media, and replies, and react to every message your account receives.', links: [['Send a message with the API', DOCS_PATHS.sendMessage], ['Messages and events', DOCS_PATHS.messages], ['Images and files', DOCS_PATHS.media], ['Groups', DOCS_PATHS.groups], ['Session events', DOCS_PATHS.sessionEvents]] },
  { title: 'Build bots and integrations', description: 'Automate replies in Node.js or Python, and send WhatsApp events to the tools you already use.', links: [['Build a WhatsApp bot', DOCS_PATHS.whatsappBot], ['WhatsApp bot in Python', DOCS_PATHS.whatsappBotPython], ['WhatsApp webhooks', DOCS_PATHS.webhooks], ['Chatwoot', DOCS_PATHS.chatwoot], ['Integration guides', DOCS_PATHS.integrationsOverview]] },
  { title: 'Run and maintain', description: 'Configure sessions, run several accounts, and keep the API healthy on your own server.', links: [['Configuration and CLI', DOCS_PATHS.configuration], ['Multiple sessions', DOCS_PATHS.multiSession], ['Cloudflare proxy', DOCS_PATHS.cloudflareProxy], ['How open-wa works', DOCS_PATHS.runtimeModel], ['Troubleshooting', DOCS_PATHS.errorHandling]] },
];

export function DocsHomepage() {
  return <div className="docs-hub">
    <header className="docs-hub-header">
      <div><h1>WhatsApp API documentation</h1><p className="docs-hub-intro">Set up the self-hosted open-wa WhatsApp API, send messages from Node.js or HTTP, and connect your application. If you already have a session running, jump to the guides or look up a method.</p><p className="docs-hub-version"><a href={DOCS_PATHS.changelog}>Documentation for v{CURRENT_VERSION}</a></p></div>
      <div className="docs-hub-wally" aria-hidden="true"><WorkbenchTexture /><img src="/mascots/wally-quickstart-transparent.png" alt="Wally, the open-wa mascot" width="180" height="180" /></div>
    </header>
    <section className="docs-hub-paths" aria-label="Start building">{paths.map(path => <a href={path.href} key={path.href}><path.icon size={23} /><h2>{path.title}</h2><p>{path.description}</p><ArrowRight size={18} aria-hidden="true" /></a>)}</section>
    <p className="docs-hub-reference"><BookOpen size={17} aria-hidden="true" /><span>Already have a session running?</span><a href={DOCS_PATHS.referenceClient}>Open the Client API reference <ArrowRight size={15} aria-hidden="true" /></a></p>
    <section className="docs-hub-topics" aria-label="Browse documentation">{topics.map(topic => <div key={topic.title}><h2>{topic.title}</h2><p>{topic.description}</p>{topic.links.map(([label, href]) => <a key={href} href={href}>{label}<ArrowRight size={15} /></a>)}</div>)}</section>
    <aside className="docs-hub-license"><ShieldCheck size={24} /><div><h2>Choose a license for your application</h2><p>See which features need Restricted or Insiders access and what each requires before you buy.</p></div><a href={DOCS_PATHS.licensedFeatures} className="ow-license-foil">Compare features <ArrowRight size={16} /></a></aside>
  </div>;
}
