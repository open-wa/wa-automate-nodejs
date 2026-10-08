import type { RawAudioFormat } from '@open-wa/schema';

export const RAW_AUDIO_DEFAULT: RawAudioFormat = { encoding: 'pcm16le', sampleRate: 16_000, channels: 1 };
export const HOST_AUDIO_RATE = 48_000;

export function decodePcm(bytes: Uint8Array, format: RawAudioFormat): Float32Array {
  const width = format.encoding === 'float32le' ? 4 : 2;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const output = new Float32Array(Math.floor(bytes.length / width / format.channels));
  for (let frame = 0; frame < output.length; frame++) {
    let sample = 0;
    for (let channel = 0; channel < format.channels; channel++) {
      const offset = (frame * format.channels + channel) * width;
      sample += format.encoding === 'float32le' ? view.getFloat32(offset, true) : view.getInt16(offset, true) / 32768;
    }
    output[frame] = Number.isFinite(sample) ? sample / format.channels : 0;
  }
  return output;
}

export function encodePcm(samples: Float32Array, encoding: RawAudioFormat['encoding'] = 'pcm16le'): Uint8Array {
  const output = new Uint8Array(samples.length * (encoding === 'float32le' ? 4 : 2));
  const view = new DataView(output.buffer);
  for (let i = 0; i < samples.length; i++) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    if (encoding === 'float32le') view.setFloat32(i * 4, value, true);
    else view.setInt16(i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
  }
  return output;
}

/** Streaming phase is retained across arbitrary frame boundaries. */
export class AudioResampler {
  private phase = 0;
  private previous = 0;
  constructor(private readonly outputRate: number) {}
  process(input: Float32Array, inputRate: number): Float32Array {
    if (inputRate === this.outputRate) return input;
    const values: number[] = [];
    const step = inputRate / this.outputRate;
    while (this.phase < input.length) {
      const left = Math.floor(this.phase);
      const a = left < 0 ? this.previous : input[left];
      const b = input[Math.min(left + 1, input.length - 1)];
      values.push(a + (b - a) * (this.phase - left));
      this.phase += step;
    }
    this.phase -= input.length;
    this.previous = input.at(-1) ?? this.previous;
    return Float32Array.from(values);
  }
}

export function wavHeader(length: number, rate = 16_000): Uint8Array {
  const bytes = new Uint8Array(44);
  const view = new DataView(bytes.buffer);
  const text = new TextEncoder();
  bytes.set(text.encode('RIFF')); view.setUint32(4, 36 + length, true);
  bytes.set(text.encode('WAVEfmt '), 8); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  bytes.set(text.encode('data'), 36); view.setUint32(40, length, true);
  return bytes;
}
