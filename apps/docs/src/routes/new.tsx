import { createFileRoute } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Copy, Link2, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { baseOptions } from '@/lib/layout.shared';
import { buildCommand, choices, optionErrors, pluginChoices, readBuilderSearch, type SetupOptions } from '../../../../packages/create/src/options.js';
import { renderProject } from '../../../../packages/create/src/templates.js';
import '@/styles/project-builder.css';

export const Route = createFileRoute('/new')({
  validateSearch: readBuilderSearch,
  head: () => ({
    meta: [{ title: 'Create your project | open-wa' }, { name: 'description', content: 'Configure an open-wa Easy API or SDK project. Choose JavaScript or TypeScript, a browser and plugins, then copy your setup command.' }],
    links: [{ rel: 'canonical', href: 'https://openwa.dev/new' }],
  }),
  component: ProjectBuilder,
});

function ProjectBuilder() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [options, setOptions] = useState<SetupOptions>(search);
  const [selectedFile, setSelectedFile] = useState('wa.config.js');
  const [copied, setCopied] = useState('');
  const [copyError, setCopyError] = useState('');
  const errors = optionErrors(options);
  const valid = errors.length === 0;
  const files = useMemo(() => optionErrors(options).length ? {} : renderProject(options), [options]);
  const filenames = Object.keys(files);
  const file = selectedFile in files ? selectedFile : `wa.config.${options.language}`;
  const command = valid ? buildCommand(options) : '';
  useEffect(() => { setOptions(search); }, [search]);
  useEffect(() => {
    if (!valid || JSON.stringify(options) === JSON.stringify(search)) return;
    const timer = setTimeout(() => { void navigate({ search: options, replace: true, resetScroll: false }); }, 200);
    return () => clearTimeout(timer);
  }, [options, search, valid, navigate]);
  function update<K extends keyof SetupOptions>(key: K, value: SetupOptions[K]) {
    setOptions(current => ({ ...current, [key]: value }));
  }
  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value); setCopied(label); setCopyError('');
      setTimeout(() => setCopied(current => current === label ? '' : current), 2500);
    } catch { setCopyError('Copy was unavailable. Select the text and copy it manually.'); }
  }
  function optionGroup(key: 'mode' | 'language' | 'browser' | 'voxtralMode', title: string) {
    return <fieldset className="setup-section"><legend>{title}</legend><div className="setup-options">
      {choices[key].map(choice => <label key={choice.value} className={`setup-option ${options[key] === choice.value ? 'is-selected' : ''}`}>
        <input type="radio" name={key} value={choice.value} checked={options[key] === choice.value} onChange={() => update(key, choice.value)} />
        <span><strong>{choice.label}</strong><span>{choice.description}</span></span>
      </label>)}
    </div></fieldset>;
  }
  return <HomeLayout {...baseOptions()}><main className="setup-builder">
    <header className="setup-heading"><div><h1>Create your open-wa project</h1><p>Choose your setup, copy one command, then link WhatsApp. You’ll need Node.js 22.21.1 or newer.</p></div>
      <a href="/docs/getting-started/initializer">Setup guide <ArrowRight size={16} /></a>
    </header>
    <div className="setup-layout"><section className="setup-form" aria-label="Project choices">
      <div className="setup-section"><label className="setup-label" htmlFor="setup-directory">Project folder</label><input id="setup-directory" value={options.directory} onChange={event => update('directory', event.target.value)} autoComplete="off" spellCheck={false} /></div>
      {optionGroup('mode', 'What are you building?')}{optionGroup('language', 'Language')}{optionGroup('browser', 'Browser')}
      <p className="setup-note">This website can’t inspect installed applications. Chrome detection happens locally when you run the command; downloads happen when you start the project.</p>
      <fieldset className="setup-section"><legend>Plugins <span>Optional</span></legend><div className="setup-options">
        {pluginChoices.map(plugin => {
          const checked = options.plugins.includes(plugin.value), allowed = plugin.modes.includes(options.mode);
          return <label key={plugin.value} className={`setup-option ${checked ? 'is-selected' : ''} ${!allowed && !checked ? 'is-disabled' : ''}`}>
            <input type="checkbox" checked={checked} disabled={!allowed && !checked} onChange={() => update('plugins', checked ? options.plugins.filter(id => id !== plugin.value) : [...options.plugins, plugin.value])} />
            <span><strong>{plugin.label}</strong><span>{allowed ? plugin.description : 'Requires Easy API webhook routes.'}</span></span>
          </label>;
        })}
      </div><p className="setup-note">Only selected plugins are installed, on demand at startup. Their required environment variables appear in the file preview.</p></fieldset>
      {options.plugins.includes('voxtral') && <>{optionGroup('voxtralMode', 'Voxtral conversations')}<p className="setup-note">Uses your Mistral API key. <a href="/docs/guides/voxtral">Read the Voxtral guide</a>{options.voxtralMode !== 'voice-notes' && <>. Calls also need an <a href="/docs/guides/calls">open-wa calling license</a></>}.</p></>}
      <div className="setup-section"><label className="setup-install"><input type="checkbox" checked={options.install} onChange={event => update('install', event.target.checked)} /> Install project dependencies during setup</label><p className="setup-note">Turn this off to generate files first and run <code>npm install</code> yourself.</p></div>
    </section><aside className="setup-output" aria-label="Your generated project">
      <section className="setup-command"><div className="setup-output-title"><h2><Terminal size={18} /> Your setup command</h2><Button size="sm" disabled={!valid} onClick={() => void copy(command, 'command')}>{copied === 'command' ? <Check size={15} /> : <Copy size={15} />}{copied === 'command' ? 'Copied' : 'Copy command'}</Button></div>
        {valid ? <pre><code>{command}</code></pre> : <div className="setup-errors" role="alert">{errors.map(error => <p key={error}>{error}</p>)}</div>}
        <p>Run this in your terminal. It creates your project with the choices shown here.</p>
        {options.plugins.length > 0 && <p>Before starting, copy <code>.env.example</code> to <code>.env</code> and fill in your selected integrations’ settings.</p>}
        <div className="setup-next"><code>cd {options.directory || 'my-bot'}</code>{!options.install && <code>npm install</code>}<code>npm start</code></div>
        <Button variant="outline" size="sm" disabled={!valid} onClick={() => void copy(new URL(`/new?${new URLSearchParams({ directory: options.directory, mode: options.mode, language: options.language, browser: options.browser, plugins: options.plugins.join(','), voxtralMode: options.voxtralMode, install: String(options.install) })}`, window.location.origin).href, 'link')}><Link2 size={15} />{copied === 'link' ? 'Link copied' : 'Share this setup'}</Button>
        {(copied || copyError) && <p role="status">{copyError || (copied === 'link' ? 'Share link copied.' : 'Copied to clipboard.')}</p>}
      </section>
      <section className="setup-files"><div className="setup-output-title"><h2>File preview <span>{filenames.length} files</span></h2><Button variant="outline" size="sm" disabled={!valid} onClick={() => void copy(files[file] ?? '', 'file')}>{copied === 'file' ? <Check size={15} /> : <Copy size={15} />}{copied === 'file' ? 'Copied' : 'Copy file'}</Button></div>
        <label className="setup-sr-only" htmlFor="setup-preview-file">Preview file</label><select id="setup-preview-file" value={file} onChange={event => setSelectedFile(event.target.value)} disabled={!valid}>{filenames.map(name => <option key={name}>{name}</option>)}</select>
        <pre><code>{files[file] ?? 'Choose valid project options to preview the files.'}</code></pre><p>These are the same templates used by the terminal wizard. Edit the generated files to make the project your own.</p>
      </section>
    </aside></div>
  </main></HomeLayout>;
}
