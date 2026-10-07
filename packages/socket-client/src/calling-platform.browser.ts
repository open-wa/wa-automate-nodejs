import { DEFAULT_MIC, DEFAULT_SPEAKER } from '@open-wa/schema/calling-media';
import type { CallMediaOptions } from '@open-wa/schema/calling-media';

const processor = `
class OpenWACallAudio extends AudioWorkletProcessor {
  constructor() { super(); this.input=[]; this.output=[]; this.cursor=0; this.muted=false; this.active=false;
    this.port.onmessage=({data})=>{if(data.type==='audio'){if(this.output.length<40)this.output.push(data.samples);else this.port.postMessage({type:'error',message:'Call playback is falling behind.'});}
      if(data.type==='active'){this.active=true;this.input=[];}if(data.type==='mute')this.muted=data.value;if(data.type==='clear'){this.output=[];this.cursor=0;}};
  }
  process(inputs,outputs) {
    const input=inputs[0];if(this.active&&input?.[0])for(let i=0;i<input[0].length;i++){let x=0;for(const channel of input)x+=channel[i];this.input.push(this.muted?0:x/input.length);if(this.input.length===320){const pcm=new Int16Array(this.input.map(x=>Math.max(-32768,Math.min(32767,Math.round(x*32767)))));this.port.postMessage({type:'audio',bytes:pcm.buffer},[pcm.buffer]);this.input=[];}}
    const output=outputs[0];if(output?.[0])for(let i=0;i<output[0].length;i++){const frame=this.output[0];const x=frame?frame[this.cursor++]:0;for(const channel of output)channel[i]=x;if(frame&&this.cursor>=frame.length){this.output.shift();this.cursor=0;}}return true;
  }
}registerProcessor('openwa-call-audio',OpenWACallAudio);`;

/** Device permission and playback start inside the caller's click gesture. */
export async function prepareLocalMedia(media: CallMediaOptions) {
  if (media.camera != null) throw new Error('The browser media helper does not yet provide a camera. Choose an audio call.');
  const context = new AudioContext({ sampleRate: 16_000 });
  const tracks: MediaStreamTrack[] = [];
  const nodes: AudioNode[] = [];
  let inputElement: HTMLAudioElement | undefined;
  let revoked: string | undefined;
  let pump: (() => Promise<void>) | undefined;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let closed = false;
  let muted = false, clearSequence = 0;
  let outgoing: ((bytes: Uint8Array) => void) | undefined;
  let bufferSource: AudioBufferSourceNode | undefined;
  let hls: { destroy(): void } | undefined;
  let onRuntimeFailure: (error: Error) => void = () => {};
  let sourceFailure: Error | undefined;
  const close = async () => { if (closed) return; closed = true; tracks.forEach(track => track.stop()); try { bufferSource?.stop(); } catch {} nodes.forEach(node => node.disconnect()); inputElement?.pause(); hls?.destroy(); if (revoked) URL.revokeObjectURL(revoked); try { if (reader) await within(reader.cancel(), 3000, 'The microphone stream did not close.'); } finally { await context.close(); } };
  try {
    await within(context.resume(), 15_000, 'Browser audio did not become ready.');
    const url = URL.createObjectURL(new Blob([processor], { type: 'application/javascript' }));
    try { await within(context.audioWorklet.addModule(url), 15_000, 'Browser audio worklet did not become ready.'); } finally { URL.revokeObjectURL(url); }
    const worklet = new AudioWorkletNode(context, 'openwa-call-audio'); nodes.push(worklet);
    const microphone = media.microphone === undefined ? DEFAULT_MIC : media.microphone;
    const speaker = media.speaker === undefined ? DEFAULT_SPEAKER : media.speaker;
    if (microphone === DEFAULT_MIC || (microphone && typeof microphone === 'object' && 'kind' in microphone && microphone.kind === 'device')) {
      const deviceId = typeof microphone === 'object' ? microphone.deviceId : undefined;
      const stream = await within(navigator.mediaDevices.getUserMedia({ audio: deviceId ? { deviceId: { exact: deviceId } } : true }).then(stream => { if (closed) stream.getTracks().forEach(track => track.stop()); return stream; }), 15_000, 'Microphone permission did not become ready within 15 seconds.');
      tracks.push(...stream.getTracks()); const node = context.createMediaStreamSource(stream); nodes.push(node); node.connect(worklet);
    } else if (microphone && typeof microphone === 'object' && 'getReader' in microphone) {
      reader = microphone.getReader();
      pump = async () => {
        let pending = new Uint8Array(0), deadline = performance.now();
        while (!closed) {
          const next = await reader!.read(); if (next.done) break;
          const bytes = new Uint8Array(pending.length + next.value.length); bytes.set(pending); bytes.set(next.value, pending.length);
          let offset = 0;
          const epoch = clearSequence;
          while (bytes.length - offset >= 640 && !closed) { await new Promise(resolve => setTimeout(resolve, Math.max(0, deadline - performance.now()))); deadline = Math.max(deadline + 20, performance.now() - 100); if (epoch !== clearSequence) { offset = bytes.length; break; } outgoing?.(muted ? new Uint8Array(640) : bytes.slice(offset, offset + 640)); offset += 640; }
          pending = bytes.slice(offset);
        }
        if (pending.length && !closed) { const tail = new Uint8Array(640); tail.set(pending); outgoing?.(tail); }
      };
    } else if (microphone instanceof Blob) {
      if (microphone.size > 64 * 1024 * 1024) throw new Error('Browser audio files are limited to 64 MB. Use a Node file helper for larger sources.');
      const bytes = await microphone.arrayBuffer();
      const prefix = new TextDecoder().decode(bytes.slice(0, 16));
      const encoded = /^(RIFF|RF64|OggS|ID3|fLaC|FORM)/.test(prefix) || prefix.slice(4, 8) === 'ftyp' || new Uint8Array(bytes)[0] === 255;
      let buffer: AudioBuffer;
      if (encoded) buffer = await within(context.decodeAudioData(bytes), 15_000, 'The audio file did not decode within 15 seconds.');
      else { if (bytes.byteLength % 2) throw new Error('Raw PCM audio must contain whole 16-bit samples.'); buffer = context.createBuffer(1, bytes.byteLength / 2, 16_000); const channel = buffer.getChannelData(0), view = new DataView(bytes); for (let i = 0; i < channel.length; i++) channel[i] = view.getInt16(i * 2, true) / 32768; }
      bufferSource = context.createBufferSource(); bufferSource.buffer = buffer; bufferSource.connect(worklet); nodes.push(bufferSource);
    } else if (microphone) {
      // Files and HTTP audio play through the same clock as local microphone capture.
      let source: string;
      if (microphone instanceof Blob) { revoked = URL.createObjectURL(microphone); source = revoked; }
      else if (typeof microphone === 'string' && /^https?:\/\//.test(microphone)) source = microphone;
      else if (typeof microphone === 'object' && 'url' in microphone && microphone.url) source = microphone.url;
      else throw new Error('Browser microphone sources use a File, Blob, HTTP URL or local device.');
      inputElement = new Audio(); inputElement.crossOrigin = 'anonymous'; inputElement.src = source;
      const node = context.createMediaElementSource(inputElement); nodes.push(node); node.connect(worklet);
      await new Promise<void>(async (resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Audio source did not become ready within 15 seconds.')), 15_000);
        let prepared = false;
        const ready = () => { clearTimeout(timer); prepared = true; resolve(); }, fail = () => { clearTimeout(timer); const error = new Error('The selected audio could not be decoded. Check its format and browser CORS access.'); sourceFailure = error; if (prepared) onRuntimeFailure(error); else reject(error); };
        inputElement!.oncanplay = ready; inputElement!.onerror = fail;
        try {
          if (/\.m3u8(?:\?|$)/i.test(source) && !inputElement!.canPlayType('application/vnd.apple.mpegurl')) {
            const { default: Hls } = await import('hls.js');
            if (!Hls.isSupported()) { fail(); return; }
            const player = new Hls({ enableWorker: false, maxBufferLength: 5, maxMaxBufferLength: 10 }); hls = player;
            player.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) fail(); });
            player.attachMedia(inputElement!); player.on(Hls.Events.MEDIA_ATTACHED, () => player.loadSource(source));
          } else inputElement!.load();
        } catch { fail(); }
      });
    }
    const playbackGain = context.createGain(); playbackGain.gain.value = 0; nodes.push(playbackGain); worklet.connect(playbackGain); playbackGain.connect(context.destination);
    let writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
    if (speaker && typeof speaker === 'object' && 'getWriter' in speaker) writer = speaker.getWriter();
    else if (speaker === DEFAULT_SPEAKER || (speaker && typeof speaker === 'object' && 'kind' in speaker && speaker.kind === 'device')) {
      const deviceId = typeof speaker === 'object' ? speaker.deviceId : undefined;
      if (deviceId && 'setSinkId' in context) await (context as any).setSinkId(deviceId);
      playbackGain.gain.value = 1;
    } else if (speaker) throw new Error('Browser speaker outputs use the local speaker or a WritableStream. Use the recording helper to download audio.');
    return {
      microphone: microphone !== null, speaker: speaker !== null,
      async start(send: (bytes: Uint8Array) => void, onFailure: (error: Error) => void) {
        if (sourceFailure) throw sourceFailure;
        onRuntimeFailure = onFailure;
        outgoing = send;
        worklet.port.postMessage({ type: 'active' });
        bufferSource?.start();
        if (inputElement) await inputElement.play();
        if (pump) void pump().catch(error => onFailure(error instanceof Error ? error : new Error(String(error))));
        worklet.port.onmessage = ({ data }) => { try { if (data.type === 'audio') send(new Uint8Array(data.bytes)); else if (data.type === 'error') onFailure(new Error(data.message)); } catch (error) { onFailure(error instanceof Error ? error : new Error(String(error))); } };
      },
      async receive(bytes: Uint8Array) {
        if (writer) { await writer.write(bytes); return; }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const samples = Float32Array.from({ length: bytes.length / 2 }, (_, i) => view.getInt16(i * 2, true) / 32768);
        worklet.port.postMessage({ type: 'audio', samples }, [samples.buffer]);
      },
      async mute(value: boolean) { muted = value; worklet.port.postMessage({ type: 'mute', value }); },
      async clear() { clearSequence++; inputElement?.pause(); try { bufferSource?.stop(); } catch {} },
      async close() { try { await close(); } finally { if (writer) { try { await within(writer.close(), 3000, 'The received audio stream did not close.'); } finally { writer.releaseLock(); } } } },
    };
  } catch (error) { await close(); throw error; }
}

async function within<A>(operation: Promise<A>, timeoutMs: number, message: string): Promise<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), timeoutMs); })]); }
  finally { clearTimeout(timer); }
}
