import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Download } from 'lucide-react';
import type { Call, CallActionResult, CallMediaOptions } from '@open-wa/socket-client';
import { useSocket } from '@/lib/hooks/use-socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePrivacy } from '@/lib/hooks/use-privacy';

export const Route = createFileRoute('/calls')({ component: CallsPage });

// A recording belongs to the browser call, so returning to this route after
// navigating elsewhere must still offer the completed download.
let receivedRecording: string | null = null;
const recordingListeners = new Set<() => void>();
const subscribeRecording = (listener: () => void) => { recordingListeners.add(listener); return () => { recordingListeners.delete(listener); }; };
const finishRecording = (blob: Blob) => {
  if (receivedRecording) URL.revokeObjectURL(receivedRecording);
  receivedRecording = URL.createObjectURL(blob);
  for (const listener of recordingListeners) listener();
};

function CallsPage() {
  const { client, connected, error } = useSocket();
  const { redact } = usePrivacy();
  const [call, setCall] = useState<Call | null>(null);
  const [recipient, setRecipient] = useState('');
  const [source, setSource] = useState<'microphone' | 'file' | 'url' | 'sample'>('microphone');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [record, setRecord] = useState(false);
  const recording = useSyncExternalStore(subscribeRecording, () => receivedRecording, () => null);
  const [notice, setNotice] = useState('Ready for an incoming call or a call you start here.');
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    let incoming: string | undefined, states: string | undefined;
    const unavailable = (error: unknown) => { if (mounted) setNotice(error instanceof Error ? error.message : 'The calling API is unavailable.'); };
    void client.getActiveCall().then(value => { if (mounted) setCall(value); }).catch(unavailable);
    void client.onIncomingCall(value => { if (mounted) { setCall(value); setNotice('Incoming call. Choose Answer or Reject.'); } }).then(id => { incoming = id; if (!mounted) client.stopListener('onIncomingCall' as any, id); }).catch(unavailable);
    void client.onCallState(value => {
      if (!mounted) return;
      setCall(value);
      setHistory(lines => [`${new Date(value.observedAt).toLocaleTimeString()} · ${value.direction} · ${value.state}`, ...lines].slice(0, 12));
      if (value.terminal) { setMuted(false); setNotice(`Call ${value.state}. Media has been closed.`); }
      else if (value.media?.state === 'ended') { setMuted(false); setNotice(value.media.reason ?? 'Call media ended. Attach a fresh source when the session is ready.'); }
    }).then(id => { states = id; if (!mounted) client.stopListener('onCallState' as any, id); }).catch(unavailable);
    return () => { mounted = false; if (incoming) client.stopListener('onIncomingCall' as any, incoming); if (states) client.stopListener('onCallState' as any, states); };
  }, [client, connected]);

  function media(): CallMediaOptions {
    let microphone: CallMediaOptions['microphone'];
    if (source === 'file') { if (!file) throw new Error('Choose an audio file first.'); microphone = file; }
    if (source === 'url') { if (!url.trim()) throw new Error('Enter an audio URL first.'); microphone = url.trim(); }
    if (source === 'sample') microphone = new URL(import.meta.env.BASE_URL + 'calling/greeting.wav', location.origin).href;
    let speaker: CallMediaOptions['speaker'];
    if (record) {
      const chunks: Uint8Array[] = []; let size = 0;
      speaker = new WritableStream<Uint8Array>({ write(chunk) { size += chunk.length; if (size > 64 * 1024 * 1024) throw new Error('This browser recording has reached its 64 MB limit.'); chunks.push(chunk.slice()); }, close() {
        const header = new ArrayBuffer(44), view = new DataView(header); const text = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
        text(0, 'RIFF'); view.setUint32(4, 36 + size, true); text(8, 'WAVE'); text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 16_000, true); view.setUint32(28, 32_000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, size, true);
        finishRecording(new Blob([header, ...chunks], { type: 'audio/wav' }));
      } });
    }
    return { microphone, speaker };
  }
  async function action(work: () => Promise<CallActionResult>) {
    setBusy(true);
    try { const result = await work(); setNotice(result.ok ? 'Request sent. Waiting for the call’s state update.' : result.reason.message); }
    catch (error) { setNotice(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  }
  const active = call && !call.terminal;
  return <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
    <div><h1 className="text-2xl font-semibold">Calls</h1><p className="mt-1 text-muted-foreground">Use this browser’s microphone and speaker, play an audio source, or record the caller.</p></div>
    <p role="status" className="rounded-2xl border bg-muted/30 p-4">{error ?? notice}{!connected && ' Connect your session to use calling.'}</p>
    <section className="rounded-2xl border p-5 space-y-4">
      <div className="flex items-center gap-3"><Phone className="size-5" /><span className="font-medium">{active ? `${call.direction} call · ${call.state}` : 'No active call'}</span></div>
      {active && <p>{redact(call.peer)}</p>}
      <div className="flex flex-wrap gap-2">
        {active && call.direction === 'incoming' && call.state === 'ringing' && <><Button disabled={busy} onClick={() => void action(() => call.accept(media()))}>Answer</Button><Button variant="outline" disabled={busy} onClick={() => void action(() => call.reject())}>Reject</Button></>}
        {active && <><Button variant="destructive" disabled={busy} onClick={() => void action(() => call.end())}><PhoneOff className="size-4" /> End call</Button><Button variant="outline" disabled={busy} onClick={() => void action(async () => { const result = await (muted ? call.unmute() : call.mute()); if (result.ok) setMuted(!muted); return result; })}>{muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}{muted ? 'Unmute' : 'Mute'}</Button><Button variant="outline" disabled={busy} onClick={() => void action(() => call.clearAudio())}>Clear queued audio</Button><Button variant="outline" disabled={busy} onClick={() => void action(() => call.setMedia(media()))}>Use selected source</Button></>}
      </div>
      {!active && <div className="flex gap-2"><Input aria-label="Recipient" placeholder="International number or contact ID" value={recipient} onChange={event => setRecipient(event.target.value)} /><Button disabled={busy || !connected || !recipient.trim()} onClick={() => void action(() => client!.startCall(recipient.trim(), media()))}>Start audio call</Button></div>}
    </section>
    <section className="rounded-2xl border p-5 space-y-4"><h2 className="font-medium">Audio</h2>
      <label className="block">Send audio from <select className="ml-2 rounded-lg border p-2" value={source} onChange={event => setSource(event.target.value as typeof source)}><option value="microphone">My microphone</option><option value="file">An audio file</option><option value="url">An HTTP audio URL</option><option value="sample">Bundled OpenWA greeting</option></select></label>
      {source === 'file' && <input aria-label="Audio file" type="file" accept="audio/*,.pcm" onChange={event => setFile(event.target.files?.[0] ?? null)} />}
      {source === 'url' && <Input aria-label="Audio URL" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://example.com/greeting.mp3" />}
      <label className="flex items-center gap-2"><input type="checkbox" checked={record} onChange={event => setRecord(event.target.checked)} />Record received audio instead of playing it through my speaker</label>
      <p className="text-sm text-muted-foreground">Your browser asks for microphone permission when you answer or start a call. The chosen file or URL plays once; the call stays open when it finishes.</p>
      {recording && <a className="inline-flex items-center gap-2 underline" href={recording} download="received-call.wav"><Download className="size-4" />Download received audio</a>}
    </section>
    <section><h2 className="font-medium">Recent call states</h2>{history.length ? <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{history.map((line, index) => <li key={index}>{line}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Call updates appear here once the session reports them.</p>}</section>
  </main>;
}
