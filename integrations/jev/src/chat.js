export function createChat({ React, ui, json, watch, usePrivacy, openui }) {
  const { createElement: h, useEffect, useState } = React;
  return function JevChat({ chatId, children }) {
    const [snapshot, setSnapshot] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const privacy = usePrivacy(); const supported = /^\d+@(?:c\.us|lid)$/.test(chatId);
    useEffect(() => {
      setSnapshot(null); setError(''); if (!supported) return;
      const controller = new AbortController(); let timer;
      const connect = async () => {
        try { await watch(`events?peer=${encodeURIComponent(chatId)}`, value => { setSnapshot(value); setError(''); }, controller.signal); }
        catch (reason) { if (!controller.signal.aborted) { setError(reason.message); timer = setTimeout(connect, 3000); } }
      }; void connect(); return () => { controller.abort(); clearTimeout(timer); };
    }, [chatId, supported]);
    if (!supported) return children({ entries: [] });
    const person = snapshot?.conversation, status = snapshot?.status;
    const post = async action => { if (busy || !person) return; setBusy(true); setError(''); try { await json(`conversations/${person.id}/${action}`, { method: 'POST', body: '{}' }); } catch (reason) { setError(reason.message); } finally { setBusy(false); } };
    const entries = (person?.turns ?? []).filter(turn => !status?.voice || turn.channel === 'text').map(turn => {
      const content = h('div', { style: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } }, h('strong', null, turn.action ? 'Jev · chat action' : turn.role === 'assistant' ? 'Jev reply' : turn.channel === 'text' ? 'Chat request' : 'Voice transcript'),
        h('p', null, privacy.privacyMode ? 'Message hidden in privacy mode' : turn.text),
        !privacy.privacyMode && turn.openui && h(openui.Message, { source: turn.openui }),
        h('small', null, [turn.state, turn.textState, turn.previousCardRemoval && `Old card: ${turn.previousCardRemoval}`].filter(Boolean).join(' · ')),
        !privacy.privacyMode && turn.decisionTrail?.length > 0 && h('details', null, h('summary', null, 'Decision evidence'), ...turn.decisionTrail.map((step, index) => h('pre', { key: index, style: { overflow: 'auto', maxHeight: 300, fontSize: 11 } }, JSON.stringify({ phase: step.phase, format: step.decision.format, nextStep: step.decision.nextStep, facts: step.decision.facts, distributions: step.decision.distributions }, null, 2)))),
        turn.error && h('p', { role: 'alert' }, privacy.privacyMode ? 'An operation failed.' : turn.error));
      return { id: turn.id, at: turn.at, messageId: turn.messageId || turn.textId || turn.audioId, content };
    });
    const toolbar = h('div', { style: { padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' } },
      h('span', { role: 'status', style: { flex: 1 } }, h('strong', null, 'Jev · '), !status ? 'Connecting…' : !status.configured ? 'Add MISTRAL_API_KEY and JEV_API_KEY on the host' : !status.ready ? 'Waiting for WhatsApp' : status.paused || person?.paused ? 'AI paused' : 'Text assistant ready'),
      person && h(ui.Button, { size: 'sm', variant: 'outline', disabled: busy, onClick: () => void post(person.paused ? 'resume' : 'pause') }, person.paused ? 'Resume AI here' : 'Pause AI here'),
      person?.turns?.length > 0 && h(ui.Button, { size: 'sm', variant: 'outline', disabled: busy, onClick: () => void post('reset') }, 'Clear AI context'),
      (error || status?.error || status?.classifier?.error) && h('p', { role: 'alert', style: { width: '100%' } }, error || status.error || status.classifier.error));
    return children({ toolbar, entries });
  };
}
