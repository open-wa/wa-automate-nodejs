import type { IPage } from '@open-wa/driver-interface';
import { ScriptLoader } from './ScriptLoader.js';

/**
 * Shared ScriptLoader instance.
 * Assets are loaded from `transport/assets/*.js` on first use and cached in memory.
 */
const scriptLoader = new ScriptLoader();

/**
 * Ensure the ScriptLoader has loaded the required assets.
 * Safe to call multiple times — no-ops on subsequent calls.
 */
export async function ensureScriptsLoaded(): Promise<void> {
  if (!scriptLoader.has('init_patch.js')) {
    await scriptLoader.loadAll();
  }
}

/**
 * Inject the WebPack module interceptor (init-patch) into the browser page.
 *
 * This is the core patch that hooks into WhatsApp Web's module system,
 * enabling WAPI to expose internal APIs.
 *
 * @private
 */
export async function injectInitPatch(page: IPage): Promise<void> {
  await ensureScriptsLoaded();
  const script = scriptLoader.get('init_patch.js');
  await page.evaluateScript(script);
}

export async function getProgObserverScript(): Promise<string> {
  await ensureScriptsLoaded();
  return scriptLoader.get('prog_observer.js');
}

/**
 * Inject the MutationObserver that tracks the WhatsApp Web progress bar.
 *
 * Fires `ProgressBarEvent` and `CriticalInternalMessage` callbacks that
 * must be exposed on the page context via `page.exposeFunction()` before
 * this injection runs.
 *
 * @private
 */
export async function injectProgObserver(page: IPage): Promise<void> {
  const script = await getProgObserverScript();
  await page.evaluateScript(script);
}

export { scriptLoader };
