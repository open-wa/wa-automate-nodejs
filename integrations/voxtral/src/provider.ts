import type { Settings } from './config';
import { normalizeSettings } from './config';
import { SpeechPcmDecoder } from './pcm';
import { MistralChatProvider, readEvents } from '@open-wa/integration-jev/agent';
export type { ChatTurn, ProviderUsage } from '@open-wa/integration-jev/agent';
export { readEvents } from '@open-wa/integration-jev/agent';
type Json = Record<string, any>;

export class MistralProvider extends MistralChatProvider {
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

  async speech(text: string, settings: Settings, signal: AbortSignal, format: 'pcm' | 'wav' = 'pcm'): Promise<Buffer> {
    const result = await (await this.request('/audio/speech', {
      model: settings.models.speech, voice_id: settings.voice.id, input: text, response_format: format,
    }, signal)).json() as Json;
    if (typeof result.audio_data !== 'string' || !result.audio_data) throw new Error('Mistral did not return speech audio.');
    const audio = Buffer.from(result.audio_data, 'base64');
    const decoder = new SpeechPcmDecoder();
    const output = format === 'pcm' ? decoder.write(audio) : audio;
    if (format === 'pcm') decoder.finish();
    this.record({ speechCharacters: text.length });
    return output;
  }
  async *speechStream(text: string, settings: Settings, signal: AbortSignal): AsyncGenerator<Uint8Array> {
    const response = await this.request('/audio/speech', {
      model: settings.models.speech, voice_id: settings.voice.id, input: text, response_format: 'pcm', stream: true,
    }, signal);
    const decoder = new SpeechPcmDecoder();
    for await (const { event, data } of readEvents(response)) {
      if (event === 'speech.audio.delta' && typeof data.audio_data === 'string') {
        const pcm = decoder.write(Buffer.from(data.audio_data, 'base64'));
        if (pcm.length) yield pcm;
      }
      if (event === 'speech.audio.done') break;
    }
    decoder.finish();
    this.record({ speechCharacters: text.length });
  }
  async voices(signal: AbortSignal): Promise<unknown> {
    return (await this.request('/audio/voices', undefined, signal)).json();
  }
}
