import { normalizeJob, requirementsFor, chooseBackend } from './planner.mjs';
import { resolveInput, resolveAudio, isMonoOggOpus } from './input.mjs';
import { probeInput } from './probe.mjs';
import { parseWebp } from './webp.mjs';
import { admitSticker, STICKER_PROFILE } from './profile.mjs';
import { StickerError, abortIfRequested } from './errors.mjs';

/** The shared job path; execution hosts supply their available backends. */
export async function renderSticker(input, jobOptions, { browser, standalone, getStandalone }) {
  const started = performance.now(), job = normalizeJob(jobOptions);
  const source = probeInput(await resolveInput(input, job));
  // audio: true keeps a video's own sound. Any other value is a separate sound.
  if (job.audio === true && !source.mime.startsWith('video/')) throw new StickerError('INVALID_JOB', 'audio: true needs a video input. Pass a sound file or URL instead.');
  const sound = job.audio !== undefined && typeof job.audio !== 'boolean' ? await resolveAudio(job.audio, job) : undefined;
  const { audio: _audio, ...plan } = job;
  if (job.audio === true || (sound && !sound.mime)) plan.audio = true;
  const requirements = requirementsFor(source, plan);
  const backend = chooseBackend(requirements, browser ? await browser.capabilities() : { available: false, requirements: [] }, standalone, job.backend);
  abortIfRequested(job.signal);
  const renderer = backend === 'browser' ? browser : await getStandalone();
  const rendered = await renderer.render(source, { ...plan, audio: job.audio === true ? true : undefined }, requirements);
  const { audio: extracted, ...result } = rendered;
  let audio;
  if (job.audio === true) audio = extracted;
  else if (sound?.mime) audio = { bytes: sound.bytes, mime: sound.mime };
  else if (sound) audio = await renderer.convertAudio(sound.bytes, job);
  if (job.audio && !audio?.bytes?.length) throw new StickerError('RENDER_FAILED', 'The sound could not be prepared.');
  const info = parseWebp(result.bytes);
  admitSticker(info, result.bytes.length, STICKER_PROFILE.metadataReserveBytes);
  const { author, pack } = job;
  return Object.freeze({ ...result, ...info, chunks: undefined, backend, mime: 'image/webp', author, pack, ...(audio ? { audio: Object.freeze(audio) } : {}), elapsedMs: performance.now() - started });
}

/** Turn a sound into mono Ogg Opus at 48 kHz. Only a browser page converts; a clip that is already mono Ogg Opus needs none. */
export async function convertSound(input, options = {}, browser) {
  for (const [name, least, most] of [['maxSeconds', 1, 3600], ['maxBytes', 1024, 64_000_000], ['bitrate', 6000, 256_000]]) {
    const value = options[name];
    if (value !== undefined && !(Number.isInteger(value) && value >= least && value <= most)) throw new StickerError('INVALID_JOB', `audio: ${name} must be a whole number from ${least} to ${most}.`);
  }
  const { bytes } = await resolveAudio(input, options);
  if (isMonoOggOpus(bytes)) return Object.freeze({ bytes, mime: 'audio/ogg; codecs=opus' });
  let able = false;
  try { able = !!browser?.convertAudio && (await browser.capabilities()).requirements.includes('audio:convert'); }
  catch (error) { throw new StickerError('AUDIO_UNAVAILABLE', 'audio: the browser page could not be asked to convert audio. Supply a mono Ogg Opus clip.', {}, error); }
  if (!able) throw new StickerError('AUDIO_UNAVAILABLE', 'audio: converting a sound needs a browser page with WebCodecs audio encoding. Supply a mono Ogg Opus clip.');
  abortIfRequested(options.signal);
  const { maxSeconds, maxBytes, bitrate, signal } = options;
  return Object.freeze(await browser.convertAudio(bytes, { maxSeconds, maxBytes, bitrate, signal }));
}
