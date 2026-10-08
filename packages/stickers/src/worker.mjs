import { parentPort, workerData } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import { createStandaloneEnvironment } from './standalone-environment.mjs';
import { createRecipeEngine } from './recipe-engine.mjs';

let compositor, engine;
parentPort.on('message', async ({ id, input, job, requirements }) => {
  try {
    compositor ??= await createStandaloneEnvironment(workerData);
    await compositor.loadFonts(requirements);
    engine ??= await createRecipeEngine({ environment: compositor.environment, kernelBytes: await readFile(new URL('../wasm/kernels.wasm', import.meta.url)) });
    const result = await engine.render(new Blob([input.bytes], { type: input.mime }), {
      ...job, onProgress: progress => parentPort.postMessage({ id, progress }),
    });
    parentPort.postMessage({ id, result }, [result.bytes.buffer]);
  } catch (error) {
    parentPort.postMessage({ id, error: { code: error.code || 'RENDER_FAILED', message: error.message || String(error), detail: { ...error.detail, stack: error.stack } } });
  }
});
