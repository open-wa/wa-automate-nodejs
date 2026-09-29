import * as React from 'react';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import recordsJson from '@/generated/client-methods.json';
import { LicensedMethodSection } from '@/components/licensing';

type ParameterRecord = {
  name: string;
  type: string;
  required: boolean;
  description: string;
  aliases: string[];
  deprecatedAliases: string[];
  example: string;
  namedType?: string;
};

type MethodRecord = {
  id: string;
  anchor: string;
  name: string;
  namespace: string;
  description: string;
  license: string | null;
  aliases: string[];
  deprecatedAliases: string[];
  parameterOrder: string[];
  parameters: ParameterRecord[];
  returnType: string;
  returnTypeLinks: Record<string, string>;
  sdkReturnType: string | null;
  returnCaveat?: string;
  returnNotes: string;
  route: { method: string; path: string } | null;
  examples: {
    inProcessSdk: string;
    nodeCall: string;
    nodeClient: string;
    http: string;
    response: string;
  };
};

const records = recordsJson as MethodRecord[];

function TypeDisplay({ value, namedType }: { value: string; namedType?: string }) {
  const links: Record<string, string> = {
    ChatId: '/docs/concepts/glossary#chatid',
    ContactId: '/docs/concepts/glossary#contactid',
    GroupChatId: '/docs/concepts/glossary#groupchatid',
  };

  if (value.length > 180) return <details className="reference-type-details"><summary>Object · view fields</summary><pre><code>{value.replace(/; /g, ';\n')}</code></pre></details>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 align-middle">
      <code className="rounded-md border border-border bg-accent px-2 py-1 text-[0.84em] text-foreground">{value}</code>
      {namedType ? links[namedType] ? <a href={links[namedType]} className="text-[13px] text-primary underline decoration-primary/40 underline-offset-2">{namedType}</a> : <span className="text-[13px] text-primary">{namedType}</span> : null}
    </span>
  );
}

type ExampleMode = 'node' | 'http' | 'sdk';
const modes: { id: ExampleMode; label: string }[] = [
  { id: 'node', label: 'Node.js client' },
  { id: 'http', label: 'HTTP' },
  { id: 'sdk', label: 'In-process SDK' },
];

function CodeBlock({ value, lang = 'ts' }: { value: string; lang?: string }) {
  return <div className="reference-code"><DynamicCodeBlock key={`${lang}:${value}`} lang={lang} code={value} /></div>;
}

function methodSignature(method: MethodRecord): string {
  return `${method.name}(${method.parameterOrder.map((name) => {
    const parameter = method.parameters.find((item) => item.name === name);
    return `${name}${parameter?.required ? '' : '?'}`;
  }).join(', ')})`;
}

function compactExample(value: string) {
  const inline = value.replace(/\n\s*/g, ' ');
  return inline.length <= 115 ? inline : value;
}

function MethodBlock({ method, mode, expanded }: { method: MethodRecord; mode: ExampleMode; expanded: boolean }) {
  const [open, setOpen] = React.useState(expanded);
  React.useEffect(() => setOpen(expanded), [expanded]);
  const returnType = mode === 'sdk' ? method.sdkReturnType : method.returnType;
  const notes = method.returnNotes.replace(/\\\|/g, '|');
  const meaningfulNotes = notes
    .replace(/^Resolves to `[^`]+`\.\s*/, '')
    .replace(/\s*A rejected Promise indicates input validation or dispatch failure\.$/, '')
    .trim();
  const caveat = method.returnType === 'any' || method.returnType === 'any[]'
    ? 'Raw WhatsApp Web data. Validate its shape before reading fields.'
    : null;
  const content = (
    <>
      {method.license ? <span id={`${method.anchor}---${method.license}`} aria-hidden="true" /> : null}
      <div className="reference-method-heading">
        <h2><a href={`#${method.anchor}`}><code>{method.name}</code><span className="method-anchor" aria-hidden="true">#</span></a></h2>
      </div>
      <p className="reference-description">{method.description}</p>
      <details className="reference-parameters" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary>
          <code>client.{methodSignature(method)}</code>
          <span>{method.parameters.length ? `Parameters (${method.parameters.length})` : 'No parameters'} <span aria-hidden="true">{open ? '−' : '+'}</span></span>
        </summary>
        {method.parameters.length ? <div className="reference-parameter-list">
          {method.parameters.map((parameter) => <div key={parameter.name} className="reference-parameter">
            <div><code>{parameter.name}{parameter.required ? '' : '?'}</code><span>{parameter.required ? 'Required' : 'Optional'}</span></div>
            <TypeDisplay value={parameter.type} namedType={parameter.namedType} />
            {parameter.description ? <p>{parameter.description.split(' Branded type:')[0].split(' Pattern:')[0]}</p> : null}
            {parameter.example !== '-' ? <p className="parameter-example">Example: <code>{parameter.example.replace(/^`|`$/g, '').replace(/&#123;/g, '{').replace(/&#125;/g, '}')}</code></p> : null}
            {parameter.aliases.length ? <p>Also accepts: {parameter.aliases.join(', ')}</p> : null}
          </div>)}
        </div> : <p className="p-3 text-sm">Call this method without arguments.</p>}
      </details>
      <div className="reference-return"><span>{mode === 'http' ? 'Response data' : 'Returns'}</span>{returnType ? <code>{mode !== 'http' ? 'Promise<' : ''}{returnType.split(/(\b[A-Za-z][A-Za-z0-9]*\b)/).map((part, index) => method.returnTypeLinks?.[part] ? <a key={index} href={method.returnTypeLinks[part]} className="underline decoration-dotted underline-offset-4">{part}</a> : part)}{mode !== 'http' ? '>' : ''}</code> : <span>This method is not declared on the in-process Client facade. Use Node.js client or HTTP.</span>}</div>
      {mode === 'http' && /\b(void|undefined)\b/.test(method.returnType) ? <p className="reference-caveat">When no value is returned, the JSON response omits the data property.</p> : null}
      {method.returnCaveat && mode !== 'sdk' ? <p className="reference-caveat">{method.returnCaveat}</p> : null}
      {meaningfulNotes && meaningfulNotes !== method.returnCaveat && mode === 'node' ? <p className="reference-caveat">{meaningfulNotes.replace(/`/g, '')}</p> : null}
      {mode === 'sdk' && returnType && returnType !== method.returnType ? <p className="reference-caveat">This is the in-process Client contract. The remote Node.js client and HTTP API use the registry contract shown in their tabs.</p> : null}
      {caveat ? <p className="reference-caveat">{caveat}</p> : null}
      {mode !== 'sdk' || returnType ? <CodeBlock value={mode === 'http' ? method.examples.http : compactExample(mode === 'sdk' ? method.examples.inProcessSdk : method.examples.nodeCall)} lang={mode === 'http' ? 'bash' : 'ts'} /> : null}
      {mode === 'http' && method.route ? <p className="reference-route"><span>{method.route.method}</span> {method.route.path}</p> : null}
      {method.aliases.length ? <details className="reference-aliases"><summary>Aliases ({method.aliases.length})</summary><p>{method.aliases.join(', ')}</p></details> : null}
    </>
  );
  return <article id={method.anchor} className="reference-method">
    {method.license === 'insiders' || method.license === 'restricted'
      ? <LicensedMethodSection tier={method.license} className="licensed-method-compact">{content}</LicensedMethodSection>
      : content}
  </article>;
}

export function ClientReference() {
  const [query, setQuery] = React.useState('');
  const [explorerOpen, setExplorerOpen] = React.useState(false);
  const [namespace, setNamespace] = React.useState('all');
  const [mode, setMode] = React.useState<ExampleMode>('node');
  const [expanded, setExpanded] = React.useState(false);
  const [activeMethod, setActiveMethod] = React.useState('');
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const explorerRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const nav = explorerRef.current;
    const item = nav?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!nav || !item) return;
    const offset = item.getBoundingClientRect().top - nav.getBoundingClientRect().top;
    if (offset < 0 || offset + item.offsetHeight > nav.clientHeight) nav.scrollTop += offset - nav.clientHeight / 2;
  }, [activeMethod]);
  const normalizedQuery = query.trim().toLowerCase();
  const matchingRecords = records.filter((method) =>
    (namespace === 'all' || method.namespace === namespace) &&
    [method.name, method.namespace, ...method.aliases].join(' ').toLowerCase().includes(normalizedQuery));
  React.useEffect(() => {
    const observer = new IntersectionObserver(() => {
      const controls = document.querySelector('.reference-controls');
      const contentTop = controls?.getBoundingClientRect().bottom ?? 80;
      const visible = [...document.querySelectorAll<HTMLElement>('.reference-method')]
        .find((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.bottom > contentTop + 8 && bounds.top < window.innerHeight;
        });
      if (visible) setActiveMethod(visible.id);
    }, { rootMargin: '-80px 0px -65% 0px' });
    document.querySelectorAll('.reference-method').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="not-prose client-reference">
      <div className="reference-content">
        <div className="reference-controls">
          <div role="tablist" aria-label="Example language">
            {modes.map((item, index) => <button key={item.id} role="tab" aria-controls="client-method-examples" type="button" aria-selected={mode === item.id} tabIndex={mode === item.id ? 0 : -1}
              ref={(node) => { tabRefs.current[index] = node; }} onClick={() => setMode(item.id)}
              onKeyDown={(event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? modes.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + modes.length) % modes.length;
                setMode(modes[next].id); tabRefs.current[next]?.focus();
              }}>{item.label}</button>)}
          </div>
          <label><input type="checkbox" checked={expanded} onChange={(event) => setExpanded(event.target.checked)} />Expand parameters</label>
        </div>
        <details className="reference-setup">
          <summary>{mode === 'http' ? 'HTTP connection and response format' : mode === 'sdk' ? 'What is the in-process SDK?' : 'Connect the Node.js client'}</summary>
          {mode === 'node' ? <><p>Connect once to a running Easy API, then use the calls below.</p><CodeBlock value={records[0].examples.nodeClient.split('\n').filter((line) => line.startsWith('import ') || line.includes('SocketClient.connect')).join('\n')} /></>
            : mode === 'sdk' ? <p>The SDK runs WhatsApp inside your Node.js application. The examples assume you already created a runtime with <code>createClient()</code> and wrapped it in the <code>Client</code> facade. Follow <a href="/docs/getting-started/custom-code">the Node.js setup guide</a> first.</p>
              : <p>Run the Easy API on port 8080 and replace <code>YOUR_API_KEY</code> with your configured key. Successful HTTP calls wrap the return value in <code>{'{ success: true, data: … }'}</code>. The return types below describe <code>data</code>.</p>}
        </details>
        <div id="client-method-examples" role="tabpanel">{records.map((method) => <MethodBlock key={method.id} method={method} mode={mode} expanded={expanded} />)}</div>
      </div>
      <aside className="method-explorer">
        <button type="button" className="method-explorer-toggle" aria-expanded={explorerOpen} aria-controls="method-explorer-body" onClick={() => setExplorerOpen(!explorerOpen)}>Browse {records.length} methods <span aria-hidden="true">{explorerOpen ? '−' : '+'}</span></button>
        <div id="method-explorer-body" className={`method-explorer-body ${explorerOpen ? 'is-open' : ''}`}>
        <label htmlFor="client-method-filter">Method explorer</label>
        <input id="client-method-filter" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a method…" autoComplete="off" />
        <select aria-label="Method category" value={namespace} onChange={(event) => setNamespace(event.target.value)}><option value="all">All categories</option>{[...new Set(records.map((method) => method.namespace))].sort().map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <p aria-live="polite">{matchingRecords.length} of {records.length} methods</p>
        {!matchingRecords.length ? <div className="method-empty">No methods match this filter.<button type="button" onClick={() => { setQuery(''); setNamespace('all'); }}>Clear filters</button></div> : null}
        <nav ref={explorerRef} aria-label="Client methods">{matchingRecords.map((method) => <a key={method.id} href={`#${method.anchor}`} aria-current={activeMethod === method.anchor ? 'location' : undefined} onClick={() => setActiveMethod(method.anchor)}><span>{method.name}</span>{method.license ? <span className="method-license-dot" data-license-tier={method.license} title={`${method.license} license`} aria-label={`${method.license} license`} /> : null}</a>)}</nav>
        </div>
      </aside>
    </div>
  );
}

export { TypeDisplay };
