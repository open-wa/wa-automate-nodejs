import { StickerError } from './errors.mjs';

export const kernelAssetUrl = new URL('../wasm/kernels.wasm', import.meta.url);

export async function loadKernelBytes() {
  if (kernelAssetUrl.protocol === 'file:') {
    const { readFile } = await import('node:fs/promises');
    return new Uint8Array(await readFile(kernelAssetUrl));
  }
  const response = await fetch(kernelAssetUrl);
  if (!response.ok) throw new StickerError('RESOURCE_UNAVAILABLE', 'Sticker kernels are unavailable.');
  return new Uint8Array(await response.arrayBuffer());
}

export async function instantiateKernels(bytes) {
  const module = bytes instanceof WebAssembly.Module ? { exports: new WebAssembly.Instance(bytes).exports } : (await WebAssembly.instantiate(bytes)).instance;
  const exports = module.exports;
  if (!(exports.memory instanceof WebAssembly.Memory) || typeof exports.allocate !== 'function' || typeof exports.release !== 'function') throw new StickerError('RESOURCE_REJECTED', 'Sticker kernel ABI is invalid.');
  return {
    run(name, source, width, height, options = {}) {
      const length = width * height * 4;
      if (!Number.isInteger(width) || !Number.isInteger(height) || !Number.isSafeInteger(length) || width < 1 || height < 1 || width > 512 || height > 512 || source.length !== length) throw new StickerError('INVALID_INPUT', 'Kernel input must be bounded RGBA8 pixels.');
      const outputLength = name === 'bayer' ? length * 4 : length;
      if (options.offset !== undefined && (!Number.isInteger(options.offset) || options.offset < 0 || options.offset > 256)) throw new StickerError('INVALID_JOB','Stereo offset must be 0–256.');
      if (options.iterations !== undefined && (!Number.isInteger(options.iterations) || options.iterations < 0 || options.iterations > 8)) throw new StickerError('INVALID_JOB','Morphology iterations must be 0–8.');
      let src = 0, dst = 0, scratch = 0;
      try {
        src = exports.allocate(length); dst = exports.allocate(outputLength); scratch = exports.allocate(length);
        if (!src || !dst || !scratch) throw new StickerError('CAPACITY_EXCEEDED', 'Sticker kernel allocation failed.');
        new Uint8Array(exports.memory.buffer, src, length).set(source);
        if (name === 'invert' || name === 'grayscale') exports[name](src, dst, length);
        else if (name === 'stereo') exports.stereo(src, dst, width, height, options.offset ?? 10);
        else if (name === 'dilate' || name === 'erode') exports.morphology(src, dst, scratch, width, height, options.iterations ?? 1, name === 'dilate');
        else if (name === 'bayer') exports.bayer(src, dst, width, height);
        else throw new StickerError('UNKNOWN_EFFECT', `Unsupported numerical kernel: ${name}.`);
        return { data: new Uint8ClampedArray(exports.memory.buffer, dst, outputLength).slice(), width: name === 'bayer' ? width * 2 : width, height: name === 'bayer' ? height * 2 : height };
      } finally { if (src) exports.release(src, length); if (dst) exports.release(dst, outputLength); if (scratch) exports.release(scratch, length); }
    },
    get heapBytes() { return exports.memory.buffer.byteLength; },
  };
}
