/** Neutral OpenWA audio framing. Format is negotiated in start/ready JSON. */
export const AUDIO_WIRE_VERSION = 1;
export const AUDIO_FRAME_HEADER_BYTES = 20;
export function encodeAudioPacket(audio: Uint8Array, sequence: number, timestampMs: number): Uint8Array {
  const packet = new Uint8Array(AUDIO_FRAME_HEADER_BYTES + audio.length);
  const view = new DataView(packet.buffer);
  view.setUint32(0, 0x4f574131); // OWA1
  view.setUint32(4, sequence); view.setFloat64(8, timestampMs); view.setUint32(16, audio.length);
  packet.set(audio, AUDIO_FRAME_HEADER_BYTES); return packet;
}
export function decodeAudioPacket(packet: Uint8Array): { audio: Uint8Array; sequence: number; timestampMs: number } {
  if (packet.length < AUDIO_FRAME_HEADER_BYTES) throw new Error('Audio packet is missing its header.');
  const view = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
  const timestampMs = view.getFloat64(8);
  if (view.getUint32(0) !== 0x4f574131 || view.getUint32(16) !== packet.length - AUDIO_FRAME_HEADER_BYTES || !Number.isFinite(timestampMs)) throw new Error('Invalid OpenWA audio packet.');
  return { audio: packet.subarray(AUDIO_FRAME_HEADER_BYTES), sequence: view.getUint32(4), timestampMs };
}
