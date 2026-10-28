/** Plugin-owned Neo page. The host supplies its React instance, BoardUI, and API boundary. */
export function createPage(host) {
  const { React, ui, json, request, watch, chatUrl, usePrivacy, openui } = host;
  const { createElement: h, useEffect, useRef, useState } = React;
  const css = `
    .voxtral{display:flex;flex-direction:column;gap:24px;color:var(--text-primary,var(--foreground))}
    .vx-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.vx-between{justify-content:space-between}
    .vx-muted{color:var(--text-secondary,var(--muted-foreground));font-size:13px;line-height:1.6}
    .vx-panel{border:1px solid var(--separator-border,var(--border));border-radius:16px;background:var(--background-primary-default,var(--card));overflow:hidden}
    .vx-pad{padding:20px}.vx-stack{display:flex;flex-direction:column;gap:16px}.vx-toolbar{border-bottom:1px solid var(--separator-border,var(--border));padding:16px 20px}
    .vx-title{font-size:15px;font-weight:600}.vx-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px;align-items:start}
    .vx-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;line-height:1.4;white-space:nowrap}
    .vx-dot{width:7px;height:7px;border-radius:50%;background:#7b8290}.vx-dot[data-on=true]{background:#2b936c}
    .vx-modes{display:flex;flex-wrap:wrap;gap:6px}.vx-empty{padding:48px 24px;text-align:center;display:flex;flex-direction:column;gap:12px}
    .vx-turn{border-left:2px solid var(--separator-border,var(--border));padding:4px 0 4px 16px}.vx-turn[data-role=assistant]{border-left-color:var(--primary,#b14872)}
    .vx-turn p{white-space:pre-wrap;font-size:14px;line-height:1.65;overflow-wrap:anywhere}.vx-turn strong{font-size:12px}.vx-turn small{font-size:11px}
    .vx-activity{max-height:620px;overflow-y:auto}.vx-error{border:1px solid #d47777;border-radius:12px;padding:14px 18px;font-size:13px;line-height:1.6}
    .vx-settings{display:flex;flex-direction:column;gap:22px}.vx-field{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:500}
    .vx-field select{padding:10px 12px;border:1px solid var(--separator-border,var(--border));border-radius:10px;background:var(--background-primary-default,var(--background));color:inherit;font:inherit;min-height:40px}
    .vx-field small{font-size:12px;font-weight:400;color:var(--text-secondary,var(--muted-foreground))}.vx-check{display:flex;gap:10px;align-items:center;font-size:13px;line-height:1.5}
    .vx-stats{display:flex;gap:30px;flex-wrap:wrap}.vx-stat strong{display:block;font-size:21px;font-weight:600}.vx-stat span{font-size:12px}
    .vx-name{font-weight:600;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.vx-sub{font-size:11px;max-width:220px;overflow:hidden;text-overflow:ellipsis}
    @media(max-width:1050px){.vx-grid{grid-template-columns:1fr}.vx-activity{max-height:none}}@media(max-width:600px){.vx-pad,.vx-toolbar{padding:16px}.vx-row{align-items:flex-start}.vx-stat strong{font-size:18px}.vx-name,.vx-sub{max-width:150px}}
  `;
  const button = (label, action, props = {}) => h(ui.Button, { type: 'button', onClick: action, variant: 'outline', ...props }, label);
  const badge = (label, on) => h('span', { className: 'vx-badge' }, h('span', { className: 'vx-dot', 'data-on': on }), label);
  const field = (label, control, note) => h('label', { className: 'vx-field' }, h('span', null, label), control, note && h('small', null, note));
  const select = (value, options, onChange) => h('select', { value, onChange: event => onChange(event.target.value) }, options.map(([id, label]) => h('option', { key: id, value: id }, label)));
  const modes = [['voice-notes', 'Voice notes'], ['calls', 'Calls'], ['both', 'Both']];
  const diff = (before, after) => Object.fromEntries(Object.entries(after).flatMap(([key, value]) => {
    if (JSON.stringify(value) === JSON.stringify(before[key])) return [];
    return [[key, value && typeof value === 'object' && !Array.isArray(value) ? diff(before[key] || {}, value) : value]];
  }));

  return function VoxtralPage() {
    const privacy = usePrivacy();
    const [snapshot, setSnapshot] = useState(null);
    const [connectionError, setConnectionError] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [messagePreviewOpen, setMessagePreviewOpen] = useState(false);
    const [settings, setSettings] = useState(null);
    const [draft, setDraft] = useState(null);
    const [voices, setVoices] = useState([]);
    const [audioUrl, setAudioUrl] = useState('');
    const [actionRequest, setActionRequest] = useState('Send me the confirmation of the booking in this chat.');
    const [actionPreview, setActionPreview] = useState(null);
    const settingsButton = useRef(null);
    const sample = useRef(null);
    const alive = useRef(true);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    useEffect(() => {
      const controller = new AbortController(); let timer;
      const connect = async () => {
        try {
          const params = new URLSearchParams({ offset: String(page * 20), limit: '20', q: query });
          await watch(`events?${params}`, value => { setSnapshot(value); setConnectionError(''); }, controller.signal);
        } catch (reason) {
          if (controller.signal.aborted) return;
          setConnectionError(reason.message || 'The live connection is unavailable.');
          timer = setTimeout(connect, 3000);
        }
      };
      void connect();
      return () => { controller.abort(); clearTimeout(timer); };
    }, [page, query]);
    useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
    const run = async work => {
      if (busy) return;
      setBusy(true); setError('');
      try { return await work(); } catch (reason) { if (alive.current) setError(reason.message || String(reason)); }
      finally { if (alive.current) setBusy(false); }
    };
    const post = (path, body = {}) => json(path, { method: 'POST', body: JSON.stringify({
      ...(path.startsWith('calls/') && snapshot?.status?.call?.call ? { generation: snapshot.status.call.call.generation } : {}), ...body,
    }) });
    const change = (section, key, value) => setDraft(current => ({ ...current, [section]: { ...current[section], [key]: value } }));
    const loadSettings = async () => {
      const view = await json('settings'); setSettings(view); setDraft(structuredClone(view.settings)); setSettingsOpen(true);
      if (view.keyConfigured) {
        // The optional voice library must not hold the settings controls busy.
        void json('voices').then(library => {
          if (!alive.current) return;
          const entries = library?.items || [];
          setVoices(Array.isArray(entries) ? entries : []);
        }).catch(() => { if (alive.current) setVoices([]); });
      }
    };
    const saveSettings = async patch => {
      const view = settings || await json('settings');
      const saved = await json('settings', { method: 'PATCH', body: JSON.stringify({ revision: view.revision, settings: patch }) });
      setSettings(saved); setDraft(structuredClone(saved.settings)); return saved;
    };
    const preview = async () => {
      sample.current?.pause();
      const response = await request('voice-preview', { method: 'POST', body: JSON.stringify({ voiceId: draft.voice.id, text: 'Hello! How can I help you today?' }) });
      const url = URL.createObjectURL(await response.blob()); setAudioUrl(url);
      const audio = new Audio(url); sample.current = audio; await audio.play();
    };
    useEffect(() => () => sample.current?.pause(), []);
    const status = snapshot?.status;
    const conversations = snapshot?.conversations || [];
    const entries = conversations;
    const name = item => privacy.redactName(item.name || item.peer, item.peer);
    const switchMode = value => run(async () => {
      const fresh = await json('settings'); setSettings(fresh);
      const saved = await json('settings', { method: 'PATCH', body: JSON.stringify({ revision: fresh.revision, settings: { mode: value } }) });
      setSettings(saved); setDraft(structuredClone(saved.settings));
    });

    const header = h(ui.PageHeader, { title: 'Voxtral', description: 'Configure your assistant and view usage. Conversations stay in Chat.',
      actions: h(React.Fragment, null,
        button('Preview messages', () => setMessagePreviewOpen(true)),
        button(status?.paused ? 'Resume AI' : 'Pause AI', () => run(() => post(status.paused ? 'resume' : 'pause')), { disabled: busy || !status }),
        button('Edit assistant', () => run(loadSettings), { ref: settingsButton, variant: 'default', disabled: busy })) });

    const list = h('section', { className: 'vx-panel' },
      h('div', { className: 'vx-toolbar vx-stack' }, h('div', { className: 'vx-row vx-between' }, h('h2', { className: 'vx-title' }, 'Conversations'), h('span', { className: 'vx-muted' }, `${snapshot?.conversationTotal ?? 0} recent`)),
        h(ui.Input, { 'aria-label': 'Search conversations', placeholder: 'Find a person…', value: query, onChange: event => { setQuery(event.target.value); setPage(0); } })),
      h(ui.Table, { 'aria-label': 'Voxtral conversations', size: 'sm' },
        h(ui.TableHeader, null, h(ui.TableColumn, { id: 'person', isRowHeader: true }, 'Person'), h(ui.TableColumn, { id: 'state' }, 'Status'), h(ui.TableColumn, { id: 'actions' }, 'Actions')),
        h(ui.TableBody, { renderEmptyState: () => h('div', { className: 'vx-empty' }, h('strong', null, 'Your next conversation starts on WhatsApp'), h('p', { className: 'vx-muted' }, 'Send a voice note from another account, or call your connected number. Recent conversations will appear here.')) },
          entries.map(item => h(ui.TableRow, { key: item.id, id: item.id },
            h(ui.TableCell, null, h('div', { className: 'vx-name' }, name(item)), h('div', { className: 'vx-sub vx-muted' }, item.channel === 'calls' ? 'Audio call' : 'Voice notes')),
            h(ui.TableCell, null, h('span', { className: 'vx-badge' }, item.paused ? 'AI paused' : item.state)),
            h(ui.TableCell, null, h('div', { className: 'vx-row' }, button('Open chat', () => location.assign(chatUrl(item.peer)), { size: 'sm' }),
              button(item.paused ? 'Resume AI' : 'Pause AI', () => run(() => post(`conversations/${item.id}/${item.paused ? 'resume' : 'pause'}`)), { size: 'sm', disabled: busy }))))))),
      h('div', { className: 'vx-toolbar vx-row vx-between' }, h('span', { className: 'vx-muted' }, `Page ${page + 1}`),
        h('div', { className: 'vx-row' }, button('Previous', () => setPage(current => current - 1), { size: 'sm', disabled: page === 0 }),
          button('Next', () => setPage(current => current + 1), { size: 'sm', disabled: (page + 1) * 20 >= (snapshot?.conversationTotal ?? 0) }))));

    const settingsSheet = h(ui.DetailSheet, { title: 'Edit assistant', description: 'Changes are saved for this session and apply from the next turn.', open: settingsOpen, onOpenChange: setSettingsOpen, finalFocus: settingsButton,
      footer: h('div', { className: 'vx-row vx-between' }, button('Cancel', () => setSettingsOpen(false)), button('Save changes', () => run(async () => { await saveSettings(diff(settings.settings, draft)); setSettingsOpen(false); }), { variant: 'default', disabled: busy || !draft })) },
      draft && h('div', { className: 'vx-settings' },
        h('div', { className: 'vx-muted' }, `Mistral key: ${settings.keyConfigured ? `configured through ${settings.keySource}` : 'missing — set MISTRAL_API_KEY on the Easy API host'}`),
        field('Assistant instructions', h(ui.Textarea, { rows: 7, value: Array.isArray(draft.agent.instructions) ? draft.agent.instructions.join('\n') : draft.agent.instructions, onChange: event => change('agent', 'instructions', event.target.value.split('\n')) }), 'Write naturally, one instruction per line. The plugin combines them for the model.'),
        field('Conversation mode', select(draft.mode, modes, value => setDraft(current => ({ ...current, mode: value })))),
        h('fieldset', { className: 'vx-stack' }, h('legend', { className: 'vx-title' }, 'Chat actions'),
          h('label', { className: 'vx-check' }, h('input', { type: 'checkbox', checked: draft.actions.sendMessage, onChange: event => change('actions', 'sendMessage', event.target.checked) }), 'Send messages when asked'),
          h('p', { className: 'vx-muted' }, 'Jev chooses text, a confirmation template, buttons, a list, a form or a booking card. Voxtral fills the chosen format with agreed details. Messages and their delivery status appear in Chat.'),
          h('p', { className: 'vx-muted' }, settings.jevConfigured ? `Jev key: configured through ${settings.jevKeySource}` : 'Add JEV_API_KEY on the Easy API host to enable chat actions. Voice conversations remain available.'),
          field('Jev classifier model', h(ui.Input, { value: draft.actions.classifierModel, onChange: event => change('actions', 'classifierModel', event.target.value) })),
          field('Example chat request', h(ui.Textarea, { rows: 2, value: actionRequest, onChange: event => { setActionRequest(event.target.value); setActionPreview(null); } }), 'Preview the format using your saved classifier model and available license features. This uses Jev and sends no WhatsApp message.'),
          button('Choose format', () => run(async () => setActionPreview(await post('actions/preview', { text: actionRequest }))), { disabled: busy || !settings.jevConfigured || !actionRequest.trim() }),
          actionPreview && h('p', { className: 'vx-muted', role: 'status' }, `Jev selected: ${actionPreview.label} · ${Math.round(actionPreview.confidence * 100)}% · ${actionPreview.model}`)),
        field('Voice', voices.length ? select(draft.voice.id, [...(!voices.some(voice => (voice.id || voice.voice_id) === draft.voice.id) ? [[draft.voice.id, draft.voice.id]] : []), ...voices.map(voice => [voice.id || voice.voice_id, `${voice.name || voice.id || voice.voice_id}${voice.language ? ` · ${voice.language}` : ''}`])], value => change('voice', 'id', value)) : h(ui.Input, { value: draft.voice.id, onChange: event => change('voice', 'id', event.target.value) })),
        h('div', { className: 'vx-row' }, button('Preview voice', () => run(preview), { disabled: busy || !settings.keyConfigured }), h('span', { className: 'vx-muted' }, 'Plays here and uses your Mistral account.')),
        field('Language', h(ui.Input, { value: draft.language, onChange: event => setDraft(current => ({ ...current, language: event.target.value })), placeholder: 'auto' }), 'Use auto to follow the person, or a supported language code such as en or ar.'),
        draft.mode !== 'calls' && h('fieldset', { className: 'vx-stack' }, h('legend', { className: 'vx-title' }, 'Voice notes'),
          h('label', { className: 'vx-check' }, h('input', { type: 'checkbox', checked: draft.voiceNotes.includeText, onChange: event => change('voiceNotes', 'includeText', event.target.checked) }), 'Include a text copy of the answer'),
          h('label', { className: 'vx-check' }, h('input', { type: 'checkbox', checked: draft.voiceNotes.acceptText, onChange: event => change('voiceNotes', 'acceptText', event.target.checked) }), 'Answer typed follow-ups too')),
        draft.mode !== 'voice-notes' && h('fieldset', { className: 'vx-stack' }, h('legend', { className: 'vx-title' }, 'Calls'),
          field('Answer incoming calls', select(draft.calls.answer, [['auto', 'Automatically with Voxtral'], ['manual', 'Let me choose in the dashboard']], value => change('calls', 'answer', value))),
          field('Greeting after connection', h(ui.Textarea, { rows: 2, value: draft.calls.greeting, onChange: event => change('calls', 'greeting', event.target.value) }))),
        h('fieldset', { className: 'vx-stack' }, h('legend', { className: 'vx-title' }, 'Models and context'),
          field('Answer model', h(ui.Input, { value: draft.agent.model, onChange: event => change('agent', 'model', event.target.value) })),
          ...[['transcription', 'Voice-note transcription'], ['realtimeTranscription', 'Call transcription'], ['speech', 'Speech generation']].map(([key, label]) => h(React.Fragment, { key }, field(label, h(ui.Input, { value: draft.models[key], onChange: event => change('models', key, event.target.value) })))),
          field('Remember conversation for (minutes)', h(ui.Input, { type: 'number', min: 1, max: 1440, value: draft.conversation.idleTimeoutSeconds / 60, onChange: event => change('conversation', 'idleTimeoutSeconds', Number(event.target.value) * 60) })),
          field('Names and specialist terms', h(ui.Textarea, { rows: 3, value: draft.contextBias.join('\n'), onChange: event => setDraft(current => ({ ...current, contextBias: event.target.value.split('\n') })) }), 'One term per line. Used to improve speech recognition.')),
        settings.overrides.length > 0 && h('p', { className: 'vx-muted' }, `Saved dashboard overrides: ${settings.overrides.join(', ')}.`),
        h('div', { className: 'vx-row' }, button('Reset to config', () => run(async () => { const fresh = await post('settings/reset'); setSettings(fresh); setDraft(structuredClone(fresh.settings)); }), { disabled: busy }),
          button('Copy config', () => run(async () => { const source = await (await request('settings/export')).text(); await navigator.clipboard.writeText(source); }), { disabled: busy })),
        error && h('p', { className: 'vx-error', role: 'alert' }, error)));

    return h('div', { className: 'dashboard-page voxtral' }, h('style', null, css), header,
      h(ui.DetailSheet, { title: 'Preview messages', description: 'Try booking cards, buttons, lists, forms and confirmations.', open: messagePreviewOpen, onOpenChange: setMessagePreviewOpen }, h(openui.Workbench)),
      connectionError && h('p', { className: 'vx-error', role: 'status' }, `Disconnected · ${connectionError}`),
      error && !settingsOpen && h('p', { className: 'vx-error', role: 'alert' }, error),
      status && !status.configured && h('div', { className: 'vx-panel vx-pad vx-stack' }, h('h2', { className: 'vx-title' }, 'Add your Mistral key'), h('p', { className: 'vx-muted' }, 'Set MISTRAL_API_KEY in the environment that starts Easy API, then restart it. Your WhatsApp session continues to work while the assistant is unconfigured.')),
      h('section', { className: 'vx-panel vx-pad vx-row vx-between', 'aria-label': 'Assistant controls' },
        h('div', { className: 'vx-modes', role: 'group', 'aria-label': 'Conversation mode' }, modes.map(([id, label]) => button(label, () => switchMode(id), { key: id, variant: status?.mode === id ? 'default' : 'outline', 'aria-pressed': status?.mode === id, disabled: busy || !status }))),
        h('div', { className: 'vx-row', role: 'status' }, badge(status?.ready ? 'WhatsApp connected' : 'WhatsApp disconnected', status?.ready), badge(status?.configured ? status.paused ? 'AI paused' : 'Mistral configured' : 'Mistral key missing', status?.configured && !status.paused), status?.actions?.sendMessage && badge(status.classifier?.configured ? 'Jev configured' : 'Jev key missing', status.classifier?.configured))),
      status?.classifier?.error && h('p', { className: 'vx-error', role: 'alert' }, status.classifier.error),
      status?.error && h('p', { className: 'vx-error', role: 'alert' }, status.error), list,
      snapshot?.usage && h('section', { className: 'vx-panel vx-pad vx-stack', 'aria-label': 'Mistral usage' }, h('div', { className: 'vx-row vx-between' }, h('h2', { className: 'vx-title' }, 'Usage'), h('span', { className: 'vx-muted' }, `Since ${new Date(snapshot.usage.since).toLocaleDateString()}`)),
        h('div', { className: 'vx-stats' }, ...[[`${(snapshot.usage.audioSeconds / 60).toFixed(1)} min`, 'Reported audio processed'], [snapshot.usage.speechCharacters.toLocaleString(), 'Speech characters generated'], [(snapshot.usage.inputTokens + snapshot.usage.outputTokens).toLocaleString(), 'Reported model tokens']].map(([value, label]) => h('div', { className: 'vx-stat', key: label }, h('strong', null, value), h('span', { className: 'vx-muted' }, label)))),
        h('p', { className: 'vx-muted' }, 'Provider usage is separate from your open-wa license. Live transcription duration and interrupted requests may be missing. ', h('a', { href: 'https://mistral.ai/pricing', target: '_blank', rel: 'noreferrer' }, 'Mistral pricing'))), settingsSheet);
  };
}
