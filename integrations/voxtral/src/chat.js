/** Neo supplies React and its controls, so this module needs no separate UI bundle. */
export function createChat({ React, ui, json, watch, useCalling, usePrivacy }) {
  const { createElement: h, useEffect, useRef, useState } = React;
  const css = `.vx-chat-bar{border-bottom:1px solid var(--border);padding:10px 16px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:13px}.vx-chat-state{flex:1;min-width:150px}.vx-chat-state strong{display:block}.vx-chat-error{width:100%;color:var(--destructive)}.vx-chat-note{font-size:13px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}.vx-chat-meta{font-size:11px;opacity:.8;display:block;margin-top:4px}.vx-chat-turn{max-width:85%;border:1px solid var(--border);border-radius:14px;padding:12px 16px;background:var(--background);font-size:14px}.vx-chat-turn[data-role=assistant]{margin-inline-start:auto;border-color:var(--primary)}.vx-chat-summary{flex-basis:100%;display:grid;gap:6px}.vx-chat-interim{width:100%;margin:0;white-space:pre-wrap}.vx-chat-label{font-weight:600;display:block;margin-bottom:4px}`;
  return function VoxtralChat({ chatId, children }) {
    const privacy = usePrivacy();
    const calling = useCalling();
    const [snapshot, setSnapshot] = useState(null);
    const [error, setError] = useState('');
    const [connectionError, setConnectionError] = useState('');
    const [busy, setBusy] = useState(false);
    const [summary, setSummary] = useState('');
    const mounted = useRef(true);
    const busyRef = useRef(false);
    const supported = /^[0-9]+@(?:c\.us|lid)$/.test(chatId);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
      setSnapshot(null); setError(''); setSummary(''); setConnectionError('');
      if (!supported) return;
      const controller = new AbortController(); let timer;
      const connect = async () => {
        try {
          await watch(`events?peer=${encodeURIComponent(chatId)}&limit=1`, value => { setSnapshot(value); setConnectionError(''); }, controller.signal);
        } catch (reason) {
          if (controller.signal.aborted) return;
          setConnectionError(reason.message || 'Assistant updates disconnected.');
          timer = setTimeout(connect, 3000);
        }
      };
      void connect();
      return () => { controller.abort(); clearTimeout(timer); };
    }, [chatId, supported]);
    if (!supported) return children({ entries: [] });
    const run = async work => {
      if (busyRef.current) return;
      busyRef.current = true; setBusy(true); setError('');
      try { await work(); }
      catch (reason) { if (mounted.current) setError(reason.message || String(reason)); }
      finally { busyRef.current = false; if (mounted.current) setBusy(false); }
    };
    const status = snapshot?.status;
    const person = snapshot?.conversation;
    const live = status?.call?.call?.peer === chatId && !status.call.call.terminal ? status.call : null;
    const current = calling.active?.peer === chatId ? calling.active : null;
    const ringing = current?.direction === 'incoming' && ['incoming', 'ringing'].includes(current.state);
    const post = (path, body = {}) => json(path, { method: 'POST', body: JSON.stringify(body) });
    const callAction = (action, body = {}) => post(`calls/${encodeURIComponent((live?.call || current).id)}/${action}`, { generation: (live?.call || current).generation, ...body });
    const button = (label, action, extra = {}) => h(ui.Button, { size: 'sm', variant: 'outline', disabled: busy || calling.busy, onClick: () => void run(action), ...extra }, label);
    const hidden = text => privacy.privacyMode ? 'Message hidden in privacy mode' : text;
    const note = turn => h('div', { className: 'vx-chat-note' },
      h('span', { className: 'vx-chat-label' }, turn.channel === 'calls' ? `${turn.role === 'assistant' ? 'Voxtral' : 'Caller'} · call transcript` : turn.role === 'assistant' ? 'Voxtral reply' : 'Voice transcript'),
      turn.text ? hidden(turn.text) : 'Waiting for transcription…',
      h('small', { className: 'vx-chat-meta' }, [turn.state, turn.audioState && `Voice: ${turn.audioState}`, turn.textState && `Text: ${turn.textState}`].filter(Boolean).join(' · ')),
      turn.error && h('p', { role: 'alert' }, turn.error));
    const entries = (person?.turns || []).map(turn => {
      const messageId = turn.messageId || turn.audioId || turn.textId;
      return { id: turn.id, at: turn.at, messageId, content: messageId ? note(turn) : h('article', { className: 'vx-chat-turn', 'data-role': turn.role }, note(turn),
        h('time', { className: 'vx-chat-meta', dateTime: new Date(turn.at).toISOString() }, new Date(turn.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))) };
    });
    const toolbar = h(React.Fragment, null, h('style', null, css), h('div', { className: 'vx-chat-bar', 'aria-label': 'Voxtral conversation controls' },
      h('div', { className: 'vx-chat-state', role: 'status' }, h('strong', null, 'Voxtral'),
        !status ? 'Connecting assistant…' : !status.configured ? 'Add MISTRAL_API_KEY on the Easy API host' : !status.ready ? 'Waiting for WhatsApp' : live ? live.stage : status.paused ? 'AI paused for all chats' : person?.paused ? 'AI paused for this chat' : `${status.mode === 'both' ? 'Voice notes and calls' : status.voiceNotes ? 'Voice notes' : 'Calls'} · ${person?.state || 'Ready'}`),
      person && button(person.paused ? 'Resume AI here' : 'Pause AI here', () => post(`conversations/${person.id}/${person.paused ? 'resume' : 'pause'}`)),
      person?.turns?.length > 0 && button('Clear AI context', () => post(`conversations/${person.id}/reset`)),
      !current && status?.calls && button('Call with Voxtral', () => post('calls/start', { to: chatId }), { disabled: busy || calling.busy || Boolean(calling.active) || !status.ready || !status.configured || status.paused || person?.paused }),
      ringing && status?.calls && button('Answer with Voxtral', () => callAction('answer')),
      ringing && button('Answer myself', () => calling.answerMyself()),
      live?.owner === 'assistant' && button('Take over call', () => calling.takeOverAssistant()),
      current && !ringing && status?.calls && live?.owner !== 'assistant' && button('Return call to Voxtral', () => callAction('resume', { summary })),
      live?.owner === 'assistant' && button(live.muted ? 'Unmute AI' : 'Mute AI', () => callAction('mute', { muted: !live.muted })),
      current && button('End call', () => calling.end(), { variant: 'destructive' }),
      live?.interim && h('p', { className: 'vx-chat-interim', role: 'status' }, `Hearing: ${hidden(live.interim)}`),
      current && !ringing && live?.owner === 'human' && h('label', { className: 'vx-chat-summary' }, 'Handoff summary (optional)', h(ui.Textarea, { rows: 2, value: summary, onChange: event => setSummary(event.target.value), placeholder: 'Facts the assistant should know when it returns' }), h('small', null, 'Your microphone is not transcribed.')),
      live?.error && h('div', { className: 'vx-chat-error', role: 'alert' }, live.error, ' ', button('Reconnect assistant', () => callAction('reconnect'))),
      connectionError && h('p', { className: 'vx-chat-error', role: 'status' }, connectionError),
      error && h('p', { className: 'vx-chat-error', role: 'alert' }, error)));
    return children({ toolbar, entries });
  };
}
