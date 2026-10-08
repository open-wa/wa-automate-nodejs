import { createFileRoute } from '@tanstack/react-router';
import { Phone, PhoneOff, Mic, MicOff, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CallRecipientPicker } from '@/components/call-recipient-picker';
import { useCalling } from '@/lib/hooks/use-calling';
import { usePrivacy } from '@/lib/hooks/use-privacy';

export const Route = createFileRoute('/calls')({ component: CallsPage });

function CallsPage() {
  const calling = useCalling();
  const { active, recipient, source, file, url, record, recording, notice, busy, muted, history, connected, error } = calling;
  const { redact } = usePrivacy();
  return <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
    <div><h1 className="text-2xl font-semibold">Calls</h1><p className="mt-1 text-muted-foreground">Call a contact, choose your audio, and keep talking as you move around the dashboard.</p></div>
    <p role="status" className="rounded-2xl border bg-muted/30 p-4 text-sm">{error ?? notice}{!connected && ' Connect your session to use calling.'}</p>
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-3"><Phone className="size-5 text-primary" /><span className="font-medium">{active ? `${active.direction} call · ${active.state}` : 'Start a call'}</span></div>
      {active && <p className="text-sm">{redact(active.peer)}</p>}
      {active ? <div className="flex flex-wrap gap-2">
        {active.direction === 'incoming' && active.state === 'ringing' ? <><Button disabled={busy || !connected} onClick={() => void calling.answer()}>Answer</Button><Button variant="outline" disabled={busy || !connected} onClick={() => void calling.reject()}>Reject</Button></> : <Button variant="outline" disabled={busy || !connected} onClick={() => void calling.toggleMute()}>{muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}{muted ? 'Unmute' : 'Mute'}</Button>}
        <Button variant="destructive" disabled={busy || !connected} onClick={() => void calling.end()}><PhoneOff className="size-4" />End call</Button>
        <Button variant="outline" disabled={busy || !connected} onClick={() => void calling.clearAudio()}>Clear queued audio</Button>
        <Button variant="outline" disabled={busy || !connected} onClick={() => void calling.applyMedia()}>Use selected source</Button>
      </div> : <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
        <CallRecipientPicker />
        <Button className="h-11 shrink-0 sm:mb-6" disabled={busy || !connected || !recipient} onClick={() => { if (recipient) void calling.start(recipient); }}><Phone className="size-4" />{busy ? 'Preparing call…' : 'Start audio call'}</Button>
      </div>}
    </section>
    <section className="space-y-4 rounded-2xl border bg-card p-5"><h2 className="font-medium">Audio</h2>
      <label className="flex flex-wrap items-center gap-2 text-sm">Send audio from <select className="rounded-lg border bg-background p-2" value={source} onChange={event => calling.setSource(event.target.value as typeof source)}><option value="microphone">My microphone</option><option value="file">An audio file</option><option value="url">An HTTP audio URL</option><option value="sample">Bundled OpenWA greeting</option></select></label>
      {source === 'file' && <div className="space-y-2"><input aria-label="Audio file" type="file" accept="audio/*,.pcm" onChange={event => calling.setFile(event.target.files?.[0] ?? null)} />{file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}</div>}
      {source === 'url' && <Input aria-label="Audio URL" value={url} onChange={event => calling.setUrl(event.target.value)} placeholder="https://example.com/greeting.mp3" />}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={record} onChange={event => calling.setRecord(event.target.checked)} />Record received audio instead of playing it through my speaker</label>
      <p className="text-sm text-muted-foreground">These settings also apply when you call from Chat or answer in the call control. Your browser asks for microphone permission when needed. A file plays once; the call stays open when it finishes.</p>
      {recording && <a className="inline-flex items-center gap-2 text-sm underline" href={recording} download="received-call.wav"><Download className="size-4" />Download received audio</a>}
    </section>
    <section><h2 className="font-medium">Recent call states</h2>{history.length ? <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{history.map((value, index) => <li key={index}>{new Date(value.observedAt).toLocaleTimeString()} · {value.direction} · {value.state}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Call updates appear here once the session reports them.</p>}</section>
  </div>;
}
