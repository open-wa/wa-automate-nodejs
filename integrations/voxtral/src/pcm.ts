/** Mistral speech PCM is mono float32 LE at 24 kHz; our audio sinks use s16le. */
export class SpeechPcmDecoder {
  private remainder = Buffer.alloc(0);

  write(bytes: Uint8Array): Buffer {
    const input = Buffer.concat([this.remainder, bytes]);
    const length = input.length - input.length % 4;
    const output = Buffer.alloc(length / 2);
    for (let at = 0; at < length; at += 4) {
      const sample = input.readFloatLE(at);
      if (!Number.isFinite(sample)) throw new Error('Mistral returned an invalid PCM sample.');
      const clipped = Math.max(-1, Math.min(1, sample));
      output.writeInt16LE(Math.round(clipped * (clipped < 0 ? 32768 : 32767)), at / 2);
    }
    this.remainder = Buffer.from(input.subarray(length));
    return output;
  }

  finish(): void {
    if (this.remainder.length) throw new Error('Mistral returned a truncated PCM sample.');
  }
}
