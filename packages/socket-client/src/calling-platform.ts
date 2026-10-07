import { SessionScope } from '@open-wa/runtime-core';
import { makeNodeCallMediaHost } from '@open-wa/runtime-node';
import type { CallMediaOptions } from '@open-wa/schema';
import { DEFAULT_MIC, DEFAULT_SPEAKER } from '@open-wa/schema/calling-media';

/** Node sources are opened on the machine running this helper. */
export async function prepareLocalMedia(media: CallMediaOptions) {
  const scope = await SessionScope.make();
  try {
    if (media.camera != null) throw new Error('The Node media helper does not yet provide a camera. Use an audio source with camera: null.');
    let failure: (error: Error) => void = () => {};
    const host = await makeNodeCallMediaHost().prepare({ ...media, microphone: media.microphone === undefined ? DEFAULT_MIC : media.microphone, speaker: media.speaker === undefined ? DEFAULT_SPEAKER : media.speaker, camera: null }, scope, error => failure(error));
    if (host.microphone === 'device' || host.speaker === 'device') throw new Error('This Node helper needs microphone/speaker streams, files or URLs. Use the dashboard for local devices.');
    return {
      microphone: host.microphone !== 'disabled', speaker: host.speaker !== 'disabled',
      async start(send: (bytes: Uint8Array) => void, onFailure: (error: Error) => void) {
        failure = onFailure;
        let phase = 0;
        await host.start(async frame => {
          const samples: number[] = [];
          while (phase < frame.samples.length) { samples.push(frame.samples[Math.floor(phase)]); phase += frame.sampleRate / 16_000; }
          phase -= frame.samples.length;
          const bytes = new Uint8Array(samples.length * 2); const view = new DataView(bytes.buffer);
          samples.forEach((sample, index) => view.setInt16(index * 2, Math.round(Math.max(-1, Math.min(1, sample)) * 32767), true));
          try { send(bytes); } catch (error) { failure(error instanceof Error ? error : new Error(String(error))); throw error; }
        });
      },
      async receive(bytes: Uint8Array) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const samples = Array.from({ length: bytes.length / 2 }, (_, i) => view.getInt16(i * 2, true) / 32768);
        await host.receive({ samples, sampleRate: 16_000, sequence: 0 });
      },
      async mute(value: boolean) { await host.mute(value); },
      async clear() { await host.clear(); },
      close: () => scope.close(),
    };
  } catch (error) { await scope.close('failure'); throw error; }
}
