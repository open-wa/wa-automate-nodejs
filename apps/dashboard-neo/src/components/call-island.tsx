import { Link, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ChevronDown, Mic, MicOff, Minus, Phone, PhoneIncoming, PhoneOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCalling } from '@/lib/hooks/use-calling';
import { usePrivacy } from '@/lib/hooks/use-privacy';

export function CallIsland() {
  const calling = useCalling();
  const { call, active, pendingPeer, busy, muted, connectedAt, expanded, setExpanded, connected } = calling;
  const { redact, redactName } = usePrivacy();
  const search = useSearch({ from: '__root__' });
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active || !connectedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active?.id, connectedAt]);
  if (!call && !pendingPeer) return null;
  const open = expanded || hovered || focused;
  const peer = pendingPeer ?? calling.contacts.find(contact => contact.id === call?.peer || contact.aliases.includes(call?.peer ?? ''));
  const peerId = pendingPeer?.id ?? call?.peer ?? '';
  const name = peer ? redactName(peer.name, peer.id) : redact(peerId);
  const seconds = connectedAt ? Math.max(0, Math.floor(((call?.terminal ? call.observedAt : now) - connectedAt) / 1000)) : 0;
  const duration = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const incoming = active?.direction === 'incoming' && active.state === 'ringing';
  const status = pendingPeer ? 'Preparing call' : !connected && active ? 'Reconnecting to session' : incoming ? `Incoming ${call?.video ? 'video' : 'audio'} call` : call?.state === 'active' ? `Connected · ${duration}` : call?.terminal ? `Call ${call.state}` : call?.state === 'ringing' ? 'Ringing' : call?.state === 'connecting' ? 'Connecting' : call?.state ?? 'Calling';
  return <aside aria-label="Call controls" className={`ow-call-island ${open ? 'is-expanded' : ''}`}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true); }} onPointerLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.querySelector<HTMLButtonElement>('[data-call-toggle]')?.focus(); setExpanded(false); setHovered(false); setFocused(false); } }}>
    <div className="flex min-h-12 items-center gap-2 px-3">
      <button type="button" data-call-toggle aria-expanded={open} aria-controls="call-island-panel" onClick={() => { setExpanded(!expanded); setHovered(false); setFocused(false); }} className="flex min-w-0 flex-1 items-center gap-3 rounded-full px-1 py-2 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${incoming ? 'bg-emerald-500/15 text-emerald-600' : 'bg-primary/10 text-primary'}`}>{call?.terminal ? <PhoneOff className="size-4" /> : incoming ? <PhoneIncoming className="size-4 motion-safe:animate-pulse" /> : <Phone className="size-4" />}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{name}</span><span role="status" className="block text-xs text-muted-foreground tabular-nums">{status}{muted && ' · Muted'}</span></span>
        {open ? <Minus className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>
      {call?.terminal && <Button size="icon" variant="ghost" aria-label="Dismiss ended call" onClick={calling.dismiss}><X className="size-4" /></Button>}
    </div>
    {open && <section id="call-island-panel" className="space-y-3 border-t border-border/70 p-4">
      <p className="text-xs text-muted-foreground">{pendingPeer ? 'Preparing your selected audio source.' : incoming ? call?.video ? 'Video was offered. This dashboard currently answers with audio only.' : 'Answer with your selected audio source, or reject this call.' : call?.terminal ? call.endReason?.message ?? call.media?.reason ?? 'WhatsApp ended the call without reporting a cause.' : active?.media?.reason ?? (active?.media?.state === 'ended' ? 'Audio is disconnected. Choose a fresh source in Calls.' : 'Your call stays connected as you move around the dashboard.')}</p>
      <div className="flex flex-wrap gap-2">
        {incoming ? <><Button disabled={busy || !connected} onClick={() => void calling.answer()}><Phone className="size-4" />{call?.video ? 'Answer with audio' : 'Answer'}</Button><Button variant="destructive" disabled={busy || !connected} onClick={() => void calling.reject()}>Reject</Button></> : active && <><Button variant="outline" disabled={busy || !connected} onClick={() => void calling.toggleMute()}>{muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}{muted ? 'Unmute' : 'Mute'}</Button><Button variant="destructive" disabled={busy || !connected} onClick={() => void calling.end()}><PhoneOff className="size-4" />End call</Button></>}
        <Link to="/calls" search={search} className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-primary hover:bg-primary/10">{calling.recording && call?.terminal ? 'Download recording' : 'Audio settings'}</Link>
      </div>
      {busy && <p role="status" className="text-xs text-muted-foreground">Sending call request…</p>}
    </section>}
  </aside>;
}
