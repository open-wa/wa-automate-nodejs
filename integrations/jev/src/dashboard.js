/** Neo provides React, API authentication and the common controls. */
export function createPage({ React, ui, json }) {
  const { createElement: h, useEffect, useState } = React;
  return function JevSettings() {
    const [view, setView] = useState(null), [instructions, setInstructions] = useState(''), [model, setModel] = useState(''), [zone, setZone] = useState(''), [classifier, setClassifier] = useState(''), [actions, setActions] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
    const load = value => { setView(value); setInstructions(Array.isArray(value.settings.agent.instructions) ? value.settings.agent.instructions.join('\n') : value.settings.agent.instructions); setModel(value.settings.agent.model); setClassifier(value.settings.actions.classifierModel); setActions(value.settings.actions.sendMessage); setZone(value.settings.conversation.timeZone || ''); };
    useEffect(() => { const controller = new AbortController(); json('settings', { signal: controller.signal }).then(load).catch(reason => { if (!controller.signal.aborted) setError(reason.message); }); return () => controller.abort(); }, []);
    const save = async event => {
      event.preventDefault(); if (busy) return; setBusy(true); setError(''); setNotice('');
      try { load(await json('settings', { method: 'PATCH', body: JSON.stringify({ revision: view.revision, settings: { agent: { instructions, model }, actions: { classifierModel: classifier, sendMessage: actions }, conversation: { timeZone: zone.trim() } } }) })); setNotice('Settings saved.'); }
      catch (reason) { setError(reason.message); } finally { setBusy(false); }
    };
    const field = (title, control, detail) => h('label', { style: { display: 'grid', gap: 6 } }, h('strong', null, title), control, detail && h('small', null, detail));
    return h('main', { style: { maxWidth: 760, padding: 24, display: 'grid', gap: 18 } }, h('h1', null, 'Jev'),
      h('p', null, 'An assistant in your existing WhatsApp chats. Jev chooses the next action, Mistral writes the response, and open-wa sends it.'),
      view && h('p', { role: 'status' }, `Mistral: ${view.keyConfigured ? 'configured' : 'add MISTRAL_API_KEY on the host'} · Jev: ${view.jevConfigured ? 'configured' : 'add JEV_API_KEY on the host'}`),
      h('p', null, 'Open a conversation in Chat for its controls, cards, choices and decision evidence. With Voxtral enabled, those conversations also share context with voice notes and calls.'),
      view && h('form', { onSubmit: save, style: { display: 'grid', gap: 18 } },
        field('Agent instructions', h(ui.Textarea, { rows: 6, value: instructions, onChange: event => setInstructions(event.target.value) })),
        field('Answer model', h(ui.Input, { value: model, onChange: event => setModel(event.target.value), required: true })),
        field('Jev classifier model', h(ui.Input, { value: classifier, onChange: event => setClassifier(event.target.value), required: true })),
        field('Agreed timezone (optional)', h(ui.Input, { value: zone, onChange: event => setZone(event.target.value), placeholder: 'Europe/London' }), 'Use an IANA name. Without this setting, the conversation must supply a timezone.'),
        h('label', null, h('input', { type: 'checkbox', checked: actions, onChange: event => setActions(event.target.checked) }), ' Allow chat actions'),
        h(ui.Button, { type: 'submit', disabled: busy }, busy ? 'Saving…' : 'Save settings')),
      notice && h('p', { role: 'status' }, notice), error && h('p', { role: 'alert' }, error));
  };
}
