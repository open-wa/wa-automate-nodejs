import type { Settings } from './config';
import { normalizeSettings } from './config';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };
export type ProviderUsage = { audioSeconds?: number; speechCharacters?: number; inputTokens?: number; outputTokens?: number };
type Json = Record<string, any>;

/** Decode SSE across arbitrary network boundaries, including multi-line data. */
export async function* readEvents(response: Response): AsyncGenerator<{ event: string; data: Json }> {
  if (!response.body) throw new Error('Mistral returned no response stream.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer = (buffer + decoder.decode(value, { stream: !done })).replace(/\r\n/g, '\n');
      if (buffer.length > 2_000_000) throw new Error('Mistral sent an oversized streaming event.');
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
        const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (data === '[DONE]') return;
        if (!data) continue;
        const event = block.split('\n').find(line => line.startsWith('event:'))?.slice(6).trim() ?? 'message';
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error('Mistral reported an error in the audio stream.');
        yield { event, data: parsed };
      }
      if (done) break;
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export class MistralProvider {
  constructor(private key: () => string | undefined, private record: (usage: ProviderUsage) => void) {}

  private async request(path: string, body: object | FormData | undefined, signal: AbortSignal): Promise<Response> {
    const key = this.key();
    if (!key) throw new Error('Set MISTRAL_API_KEY on the Easy API host to enable the assistant.');
    const multipart = body instanceof FormData;
    const response = await fetch(`https://api.mistral.ai/v1${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${key}`, ...(!multipart && body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? multipart ? body : JSON.stringify(body) : undefined,
      signal: AbortSignal.any([signal, AbortSignal.timeout(90_000)]),
    });
    if (!response.ok) {
      await response.body?.cancel();
      const reason = response.status === 401 || response.status === 403 ? 'Check the API key and model access.'
        : response.status === 429 ? 'Your Mistral account has reached a usage limit.' : 'Check the selected model and audio settings.';
      throw new Error(`Mistral returned HTTP ${response.status}. ${reason}`);
    }
    return response;
  }

  async transcribe(dataUrl: string, settings: Settings, signal: AbortSignal): Promise<string> {
    const comma = dataUrl.indexOf(',');
    if (comma < 0 || !dataUrl.slice(0, comma).endsWith(';base64')) throw new Error('Decrypted audio was not a base64 data URL.');
    const bytes = Buffer.from(dataUrl.slice(comma + 1), 'base64');
    if (bytes.length > 25 * 1024 * 1024) throw new Error('This voice note exceeds the 25 MB processing limit.');
    const mime = dataUrl.slice(5, comma).split(';')[0];
    const extensions: Record<string, string> = { 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/webm': 'webm', 'audio/aac': 'aac' };
    const form = new FormData();
    form.append('model', settings.models.transcription);
    form.append('file', new Blob([new Uint8Array(bytes)], { type: mime }), `voice.${extensions[mime] ?? 'ogg'}`);
    if (settings.language !== 'auto') form.append('language', settings.language);
    for (const term of normalizeSettings(settings).contextBias) form.append('context_bias', term);
    const result = await (await this.request('/audio/transcriptions', form, signal)).json() as Json;
    this.record({ audioSeconds: result.usage?.prompt_audio_seconds });
    if (typeof result.text !== 'string') throw new Error('Mistral did not return a transcript.');
    return result.text.trim();
  }

  private chatRequest(turns: ChatTurn[], settings: Settings, stream: boolean) {
    return { model: settings.agent.model, max_tokens: 512, stream,
      messages: [{ role: 'system', content: normalizeSettings(settings).agent.instructions }, ...turns] };
  }
  private tokenUsage(usage?: Json) {
    if (usage) this.record({ inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens });
  }
  async answer(turns: ChatTurn[], settings: Settings, signal: AbortSignal): Promise<string> {
    const result = await (await this.request('/chat/completions', this.chatRequest(turns, settings, false), signal)).json() as Json;
    this.tokenUsage(result.usage);
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('Mistral did not return an answer.');
    return content.trim();
  }
  async *answerStream(turns: ChatTurn[], settings: Settings, signal: AbortSignal): AsyncGenerator<string> {
    const response = await this.request('/chat/completions', this.chatRequest(turns, settings, true), signal);
    for await (const { data } of readEvents(response)) {
      this.tokenUsage(data.usage);
      const content = data.choices?.[0]?.delta?.content;
      if (typeof content === 'string') yield content;
    }
  }
  async speech(text: string, settings: Settings, signal: AbortSignal, format: 'pcm' | 'wav' = 'pcm'): Promise<Buffer> {
    const result = await (await this.request('/audio/speech', {
      model: settings.models.speech, voice_id: settings.voice.id, input: text, response_format: format,
    }, signal)).json() as Json;
    if (typeof result.audio_data !== 'string' || !result.audio_data) throw new Error('Mistral did not return speech audio.');
    this.record({ speechCharacters: text.length });
    return Buffer.from(result.audio_data, 'base64');
  }
  async *speechStream(text: string, settings: Settings, signal: AbortSignal): AsyncGenerator<Uint8Array> {
    const response = await this.request('/audio/speech', {
      model: settings.models.speech, voice_id: settings.voice.id, input: text, response_format: 'pcm', stream: true,
    }, signal);
    for await (const { event, data } of readEvents(response)) {
      if (event === 'speech.audio.delta' && typeof data.audio_data === 'string') yield Buffer.from(data.audio_data, 'base64');
      if (event === 'speech.audio.done') break;
    }
    this.record({ speechCharacters: text.length });
  }
  async voices(signal: AbortSignal): Promise<unknown> {
    return (await this.request('/audio/voices', undefined, signal)).json();
  }
}
