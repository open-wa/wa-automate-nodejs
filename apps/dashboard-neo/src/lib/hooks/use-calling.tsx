import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Call, CallActionResult, CallMediaOptions } from '@open-wa/socket-client';
import { toast } from 'sonner';
import { useSocket } from './use-socket';
import { usePrivacy } from './use-privacy';
import { useDemo } from '../demo/use-demo';
import { useHealth } from './use-health';

export type CallRecipient = { id: string; name: string; aliases: string[] };
type AudioSource = 'microphone' | 'file' | 'url' | 'sample';
const initialNotice = 'Choose a contact to call, or answer an incoming call from any page.';

export function isCallRecipient(id: string) { return /@(c\.us|lid)$/.test(id); }
export function manualCallRecipient(value: string): string | null {
  const text = value.trim();
  if (isCallRecipient(text)) return text;
  return /^\+?[\d ()-]{7,}$/.test(text) ? text.replace(/\D/g, '') : null;
}
function serialized(value: unknown): string {
  if (typeof value === 'string') return value;
  return value && typeof value === 'object' && '_serialized' in value ? String(value._serialized) : '';
}
function recipients(contacts: unknown[], chats: unknown[]): CallRecipient[] {
  const byId = new Map<string, CallRecipient>();
  for (const value of [...contacts, ...chats]) {
    if (!value || typeof value !== 'object') continue;
    const item = value as Record<string, unknown>;
    const id = serialized(item.id) || serialized(item._serialized);
    if (!isCallRecipient(id) || item.isGroup === true || item.isMe === true) continue;
    const contact = item.contact && typeof item.contact === 'object' ? item.contact as Record<string, unknown> : {};
    const aliases = [id, serialized(contact.id), ...['phoneNumber', 'formattedPhoneNumber', 'phone', 'number', 'pn', 'lid', 'jid'].flatMap(key => [serialized(item[key]), serialized(contact[key])])].filter(Boolean);
    const name = [item.name, item.formattedTitle, item.formattedName, item.pushname, contact.name, contact.pushname].find(v => typeof v === 'string' && v.trim()) as string | undefined;
    const previous = byId.get(id);
    byId.set(id, { id, name: name || previous?.name || id, aliases: [...new Set([...(previous?.aliases ?? []), ...aliases])] });
  }
  // Match the Chat page's latest-message order, then append contacts without chats.
  const orderedChats = chats.flatMap(value => {
    if (!value || typeof value !== 'object') return [];
    const chat = value as Record<string, unknown>;
    const message = chat.lastMessage as { timestamp?: number } | undefined;
    return [{ id: serialized(chat.id) || serialized(chat._serialized), timestamp: message?.timestamp || 0 }];
  }).sort((a, b) => b.timestamp - a.timestamp);
  const ordered = new Map<string, CallRecipient>();
  for (const chat of orderedChats) {
    const recipient = byId.get(chat.id);
    if (recipient) ordered.set(recipient.id, recipient);
  }
  for (const recipient of [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    if (!ordered.has(recipient.id)) ordered.set(recipient.id, recipient);
  }
  return [...ordered.values()];
}
function wav(chunks: Uint8Array[], size: number) {
  const header = new ArrayBuffer(44), view = new DataView(header);
  const text = (at: number, value: string) => [...value].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + size, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16_000, true); view.setUint32(28, 32_000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, size, true);
  return new Blob([header, ...chunks], { type: 'audio/wav' });
}

function useCallingController() {
  const { client, connected, error, ask } = useSocket();
  const { isDemo } = useDemo();
  const { canInvokeRuntime } = useHealth();
  const { privacyMode } = usePrivacy();
  const privacy = useRef(privacyMode); privacy.current = privacyMode;
  const [call, setCall] = useState<Call | null>(null);
  const current = useRef<Call | null>(null);
  const [contacts, setContacts] = useState<CallRecipient[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<CallRecipient | null>(null);
  const [source, setSource] = useState<AudioSource>('microphone');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [record, setRecord] = useState(false);
  const [recording, setRecording] = useState<string | null>(null);
  const recordingRef = useRef<string | null>(null);
  const [notice, setNotice] = useState(initialNotice);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [pendingPeer, setPendingPeer] = useState<CallRecipient | null>(null);
  const [muted, setMuted] = useState(false);
  const [history, setHistory] = useState<Call[]>([]);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const seenIncoming = useRef(new Set<string>());

  useEffect(() => {
    if (!connected || (!isDemo && !canInvokeRuntime)) return;
    let mounted = true;
    setContactsLoading(true); setContactsError(null);
    void Promise.allSettled([ask<unknown[]>('getAllContacts'), ask<unknown[]>('getAllChats')]).then(results => {
      if (!mounted) return;
      const [contacts, chats] = results.map(result => result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []);
      setContacts(recipients(contacts, chats));
      if (results.some(result => result.status === 'rejected')) setContactsError('Some contacts could not be loaded. You can still enter a number or contact ID.');
      setContactsLoading(false);
    });
    return () => { mounted = false; };
  }, [connected, ask, canInvokeRuntime, isDemo]);

  useEffect(() => {
    if (!client || !connected || isDemo || !canInvokeRuntime) return;
    let mounted = true;
    const listeners: Array<{ event: 'onIncomingCall' | 'onCallState'; id: string }> = [];
    const receive = (value: Call) => {
      if (!mounted || (current.current?.id === value.id && current.current.observedAt > value.observedAt)) return;
      const previous = current.current;
      current.current = value; setCall(value); setPendingPeer(null);
      if (previous?.id !== value.id) { setMuted(false); setConnectedAt(null); }
      if (value.state === 'active') setConnectedAt(at => at ?? value.observedAt);
      setHistory(lines => [value, ...lines].slice(0, 12));
      if (value.terminal) { setMuted(false); setNotice(value.endReason?.message ?? value.media?.reason ?? 'WhatsApp ended the call without reporting a cause.'); toast.dismiss(`call:${value.id}`); }
      else if (value.media?.state === 'ended') { setMuted(false); setNotice(value.media.reason ?? 'Call media ended. Choose a fresh audio source to reconnect it.'); }
    };
    const unavailable = (reason: unknown) => { if (mounted) setNotice(reason instanceof Error ? reason.message : 'The calling API is unavailable.'); };
    // Subscribe before reading the snapshot, so a call cannot fall between them.
    const register = async () => {
      for (const event of ['onIncomingCall', 'onCallState'] as const) {
        const callback = (value: Call) => {
          receive(value);
          if (event !== 'onIncomingCall' || !mounted || value.terminal || seenIncoming.current.has(value.id)) return;
          seenIncoming.current.add(value.id); setExpanded(true);
          setNotice(value.video ? 'Incoming video call. This dashboard can answer with audio; live video is not available here yet.' : 'Incoming audio call. Choose Answer or Reject.');
          toast(value.video ? 'Incoming video call' : 'Incoming audio call', { id: `call:${value.id}`, description: privacy.current ? 'A contact is calling.' : value.peer,
            duration: Infinity, action: { label: 'Show call', onClick: () => setExpanded(true) } });
        };
        const id = await (event === 'onIncomingCall' ? client.onIncomingCall(callback) : client.onCallState(callback));
        if (!mounted) client.stopListener(event, id); else listeners.push({ event, id });
      }
      const beforeSnapshot = current.current;
      const value = await client.getActiveCall();
      if (value) receive(value);
      else if (mounted && current.current === beforeSnapshot && current.current && !current.current.terminal) { toast.dismiss(`call:${current.current.id}`); current.current = null; setCall(null); setMuted(false); setConnectedAt(null); }
    };
    void register().catch(unavailable);
    return () => { mounted = false; for (const { event, id } of listeners) client.stopListener(event, id); };
  }, [client, connected, isDemo, canInvokeRuntime]);

  useEffect(() => () => { if (recordingRef.current) URL.revokeObjectURL(recordingRef.current); }, []);
  function media(): CallMediaOptions {
    let microphone: CallMediaOptions['microphone'];
    if (source === 'file') { if (!file) throw new Error('Choose an audio file first.'); microphone = file; }
    if (source === 'url') { if (!url.trim()) throw new Error('Enter an audio URL first.'); microphone = url.trim(); }
    if (source === 'sample') microphone = new URL(import.meta.env.BASE_URL + 'calling/greeting.wav', location.origin).href;
    let speaker: CallMediaOptions['speaker'];
    if (record) {
      const chunks: Uint8Array[] = []; let size = 0;
      speaker = new WritableStream<Uint8Array>({
        write(chunk) { size += chunk.length; if (size > 64 * 1024 * 1024) throw new Error('This browser recording has reached its 64 MB limit.'); chunks.push(chunk.slice()); },
        close() { if (recordingRef.current) URL.revokeObjectURL(recordingRef.current); const next = URL.createObjectURL(wav(chunks, size)); recordingRef.current = next; setRecording(next); },
      });
    }
    return { microphone, speaker };
  }
  async function action(work: () => Promise<CallActionResult>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      const result = await work();
      setNotice(result.ok ? 'Request sent. Waiting for the call’s state update.' : result.reason.message);
      if (!result.ok) toast(result.status === 'unknown' ? 'Call outcome unknown' : 'Call unavailable', { description: result.reason.message });
      return result;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setNotice(message); toast('Could not complete the call action', { description: message });
    } finally { busyRef.current = false; setBusy(false); }
  }
  const active = call && !call.terminal ? call : null;
  const start = async (target: CallRecipient) => {
    if (busyRef.current || active) { setExpanded(true); return; }
    if (!client || !connected || isDemo) { setNotice(isDemo ? 'Demo mode does not place real calls. Connect a session to call.' : 'Connect your session to start a call.'); return; }
    setRecipient(target); setPendingPeer(target); setExpanded(true);
    await action(() => client.startCall(target.id, media()));
    setPendingPeer(null);
    // Read the authoritative state after dispatch without retrying the call.
    try { const value = await client.getActiveCall(); if (value && (!current.current || current.current.observedAt <= value.observedAt)) { current.current = value; setCall(value); } } catch { /* State events can still arrive. */ }
  };
  const dismiss = () => { if (!active) { current.current = null; setCall(null); setExpanded(false); } };
  return { call, active, contacts, contactsLoading, contactsError, recipient, setRecipient, source, setSource, file, setFile, url, setUrl, record, setRecord, recording, notice,
    busy, muted, history, connectedAt, expanded, setExpanded, connected: connected && !isDemo, error, pendingPeer, start, dismiss,
    answer: () => active && action(() => active.accept(media())), reject: () => active && action(() => active.reject()), end: () => active && action(() => active.end()),
    toggleMute: () => active && action(async () => { const result = await (muted ? active.unmute() : active.mute()); if (result.ok) setMuted(!muted); return result; }),
    clearAudio: () => active && action(() => active.clearAudio()), applyMedia: () => active && action(() => active.setMedia(media())),
  };
}
const CallingContext = createContext<ReturnType<typeof useCallingController> | null>(null);
export function CallingProvider({ children }: { children: ReactNode }) {
  const value = useCallingController();
  return <CallingContext.Provider value={value}>{children}</CallingContext.Provider>;
}
export function useCalling() {
  const value = useContext(CallingContext);
  if (!value) throw new Error('CallingProvider is missing from the dashboard shell.');
  return value;
}
