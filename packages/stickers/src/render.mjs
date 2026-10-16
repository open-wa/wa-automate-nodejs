import { normalizeJob, requirementsFor, chooseBackend } from './planner.mjs';
import { resolveInput } from './input.mjs';
import { probeInput } from './probe.mjs';
import { parseWebp } from './webp.mjs';
import { admitSticker, STICKER_PROFILE } from './profile.mjs';
import { abortIfRequested } from './errors.mjs';

/** The shared job path; execution hosts supply their available backends. */
export async function renderSticker(input, jobOptions, { browser, standalone, getStandalone }) {
  const started = performance.now(), job = normalizeJob(jobOptions);
  const source = probeInput(await resolveInput(input, job));
  const requirements = requirementsFor(source, job);
  const backend = chooseBackend(requirements, browser ? await browser.capabilities() : { available: false, requirements: [] }, standalone, job.backend);
  abortIfRequested(job.signal);
  const renderer = backend === 'browser' ? browser : await getStandalone();
  const result = await renderer.render(source, job, requirements);
  const info = parseWebp(result.bytes);
  admitSticker(info, result.bytes.length, STICKER_PROFILE.metadataReserveBytes);
  const { author, pack } = job;
  return Object.freeze({ ...result, ...info, chunks: undefined, backend, mime: 'image/webp', author, pack, elapsedMs: performance.now() - started });
}
