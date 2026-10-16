import { StickerError } from './errors.mjs';
import { STICKER_PROFILE } from './profile.mjs';
import { effectCatalogue } from './catalogue.mjs';
import { isPortableColor } from './colors.mjs';

export function normalizeJob(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new StickerError('INVALID_JOB', 'Sticker options must be an object.');
  const allowed = new Set(['effects','backend','quality','fit','circle','background','trim','fps','loopCount','author','pack','quotedMsgId','signal','onProgress']);
  for (const key of Object.keys(options)) if (!allowed.has(key)) throw new StickerError('INVALID_JOB', `Unknown sticker option: ${key}.`, { option: key });
  const backend = options.backend ?? 'auto';
  if (!['auto','browser','standalone'].includes(backend)) throw new StickerError('INVALID_JOB', 'Backend must be auto, browser or standalone.');
  if (!Array.isArray(options.effects ?? []) || (options.effects?.length ?? 0) > STICKER_PROFILE.maxEffects) throw new StickerError('INVALID_JOB', 'Supply at most eight ordered effects.');
  const effects = (options.effects ?? []).map(value => {
    const descriptor = typeof value === 'string' ? { name: value } : value;
    if (!descriptor || typeof descriptor.name !== 'string' || !effectCatalogue[descriptor.name]) throw new StickerError('UNKNOWN_EFFECT', `Unknown sticker effect: ${descriptor?.name ?? value}.`);
    const recipe = effectCatalogue[descriptor.name];
    if (!recipe.implemented) throw new StickerError('CAPABILITY_UNAVAILABLE', `${descriptor.name}: ${recipe.unavailableReason}`, { effect: descriptor.name });
    if (Object.keys(descriptor).some(key => key !== 'name' && key !== 'options')) throw new StickerError('INVALID_JOB', 'Effect descriptors accept name and options only.');
    if (descriptor.options !== undefined && (!descriptor.options || typeof descriptor.options !== 'object' || Array.isArray(descriptor.options))) throw new StickerError('INVALID_JOB', 'Effect options must be an object.');
    for (const [key,value] of Object.entries(descriptor.options || {})) {
      if (!(key in recipe.defaults)) throw new StickerError('INVALID_JOB', `${descriptor.name}: unknown option ${key}.`);
      const defaultValue = recipe.defaults[key];
      if (typeof defaultValue === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) throw new StickerError('INVALID_JOB', `${descriptor.name}: ${key} must be a finite number.`);
      if (typeof defaultValue === 'number') {
        const { min, max, integer } = recipe.options[key];
        if(value < min || value > max || (integer && !Number.isInteger(value))) throw new StickerError('INVALID_JOB',`${descriptor.name}: invalid ${key}; expected ${min}–${max}.`);
      }
      if (typeof defaultValue === 'string' && (typeof value !== 'string' || value.length > 128)) throw new StickerError('INVALID_JOB', `${descriptor.name}: ${key} must be a string of at most 128 characters.`);
      if (key === 'color' && !isPortableColor(value)) throw new StickerError('INVALID_JOB', 'Use a portable sRGB colour: hex, a named colour, or comma-separated RGB/HSL.');
      if (key === 'eyes' && (!Array.isArray(value) || value.length !== 2 || value.some(eye=>!Array.isArray(eye)||eye.length!==2||eye.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>1)))) throw new StickerError('INVALID_JOB','Eye anchors must be two [x,y] pairs between 0 and 1.');
    }
    return { name: descriptor.name, options: { ...descriptor.options }, version: recipe.version };
  });
  const quality = options.quality ?? 0.82;
  if (typeof quality !== 'number' || !Number.isFinite(quality) || quality < .01 || quality > 1) throw new StickerError('INVALID_JOB', 'Quality must be between 0.01 and 1.');
  const fit = options.fit ?? 'contain';
  if (!['contain','cover'].includes(fit)) throw new StickerError('INVALID_JOB', 'Fit must be contain or cover.');
  if (options.fps !== undefined && (!Number.isInteger(options.fps) || options.fps < 1 || options.fps > 30)) throw new StickerError('INVALID_JOB', 'FPS must be an integer from 1 to 30.');
  if (options.loopCount !== undefined && (!Number.isInteger(options.loopCount) || options.loopCount < 0 || options.loopCount > 65535)) throw new StickerError('INVALID_JOB', 'Loop count must be 0–65535.');
  if (options.trim !== undefined && (!Array.isArray(options.trim) || options.trim.length !== 2 || options.trim.some(v => !Number.isFinite(v) || v < 0) || options.trim[1] <= options.trim[0])) throw new StickerError('INVALID_JOB', 'Trim is [startMs, endMs] with an increasing finite range.');
  if (options.circle !== undefined && typeof options.circle !== 'boolean') throw new StickerError('INVALID_JOB', 'Circle must be boolean.');
  for (const key of ['author','pack']) if (options[key] !== undefined && (typeof options[key] !== 'string' || options[key].length > 128)) throw new StickerError('INVALID_JOB', `${key} must be a string of at most 128 characters.`);
  if (options.quotedMsgId !== undefined && (typeof options.quotedMsgId !== 'string' || !/^(true|false)_[^\s_]+@[^\s_]+_[^\s]+$/.test(options.quotedMsgId))) throw new StickerError('INVALID_JOB','quotedMsgId must be a serialized message ID.');
  if (options.background !== undefined && (typeof options.background !== 'string' || options.background.length > 64 || !isPortableColor(options.background))) throw new StickerError('INVALID_JOB', 'Background must be a portable sRGB colour.');
  if (options.signal !== undefined && (typeof options.signal?.addEventListener !== 'function' || typeof options.signal?.aborted !== 'boolean')) throw new StickerError('INVALID_JOB', 'Signal must be an AbortSignal.');
  if (options.onProgress !== undefined && typeof options.onProgress !== 'function') throw new StickerError('INVALID_JOB','onProgress must be a function.');
  return { ...options, backend, quality, fit, effects };
}

/** Validate a job without decoding media or starting a renderer. */
export function validateStickerJob(job = {}) { normalizeJob(job); }

export function requirementsFor(input, job) {
  const requirements = new Set(['canvas2d', 'encode:image/webp', `decode:${input.mime}`]);
  if (input.animated) requirements.add(`animation:${input.mime}`);
  for (const effect of job.effects) for (const requirement of effectCatalogue[effect.name].requirements) requirements.add(requirement);
  return [...requirements];
}

export function chooseBackend(requirements, browser, standalone, requested = 'auto') {
  const fits = backend => backend?.available && requirements.every(requirement => backend.requirements.includes(requirement));
  const chosen = requested === 'auto' ? (fits(browser) ? 'browser' : 'standalone') : requested;
  const capability = chosen === 'browser' ? browser : standalone;
  if (!fits(capability)) throw new StickerError('CAPABILITY_UNAVAILABLE', `${chosen} cannot execute the complete sticker job.`, {
    backend: chosen, missing: requirements.filter(requirement => !capability?.requirements.includes(requirement)),
  });
  return chosen;
}
