import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { cachedResource } from './resource-cache.mjs';
import { resourceManifest } from './resources.mjs';
import { defaultOptions } from './webp-encoder-options.mjs';
import { isPortableColor } from './colors.mjs';

// A portable CPU compositor: no Chromium process, platform addon or Sharp.
export async function createStandaloneEnvironment(options = {}) {
  const [loaderPath, wasmPath, encoderPath, encoderWasmPath] = await Promise.all([
    cachedResource(resourceManifest.canvaskitJs, options),
    cachedResource(resourceManifest.canvaskitWasm, options),
    cachedResource(resourceManifest.webpEncoderJs, options),
    cachedResource(resourceManifest.webpEncoderWasm, options),
  ]);
  const init = createRequire(import.meta.url)(loaderPath);
  const kit = await init({ locateFile: name => name.endsWith('.wasm') ? wasmPath : name });
  kit.setDecodeCacheLimitBytes(16 * 1024 * 1024);
  const encoderFactory = (await import(pathToFileURL(encoderPath).href)).default;
  const encoderModule = await WebAssembly.compile(await readFile(encoderWasmPath));
  const encoder = await encoderFactory({ noInitialRun: true, instantiateWasm(imports, callback) {
    const instance = new WebAssembly.Instance(encoderModule, imports); callback(instance); return instance.exports;
  } });
  const fontOwner = kit.MakeCanvas(1, 1);
  const loadedFonts = new Set();
  class ImageData {
    constructor(data, width, height) { this.data = data; this.width = width; this.height = height; }
  }
  const pixelsToImage = (pixels, width, height) => kit.MakeImage({
    width, height, colorType: kit.ColorType.RGBA_8888,
    alphaType: kit.AlphaType.Unpremul, colorSpace: kit.ColorSpace.SRGB,
  }, pixels, width * 4);
  const wrapImage = raw => {
    if (!raw) throw Error('The standalone codec could not decode this image.');
    return { raw, width: raw.width(), height: raw.height(), close() { raw.delete(); } };
  };
  function createSurface(width, height) {
    const canvas = kit.MakeCanvas(width, height);
    if (!canvas) throw Error('Compositor capacity exceeded.');
    const native = canvas.getContext('2d');
    let align = 'left', smooth = true;
    const stack = [];
    const context = new Proxy(native, {
      get(target, key) {
        if (key === 'imageSmoothingEnabled') return smooth;
        if (key === 'textAlign') return align;
        if (key === 'save') return () => { stack.push({ align, smooth }); target.save(); };
        if (key === 'restore') return () => { const state = stack.pop(); if (state) ({ align, smooth } = state); target.restore(); };
        if (key === 'drawImage') return (source, ...args) => {
          let temporary;
          const raw = source.raw || (temporary = pixelsToImage(source.getContext('2d').getImageData(0, 0, source.width, source.height).data, source.width, source.height));
          try {
            // CanvasKit's emulated Canvas ignores imageSmoothingEnabled. Supply
            // the nearest-neighbour draw used by the pixelate recipe ourselves.
            if (!smooth && args.length === 4 && args[0] === 0 && args[1] === 0) {
              const [,,w,h] = args, sw = raw.width(), sh = raw.height();
              const sourcePixels = raw.readPixels(0, 0, { width: sw, height: sh, colorType: kit.ColorType.RGBA_8888, alphaType: kit.AlphaType.Unpremul, colorSpace: kit.ColorSpace.SRGB });
              const result = new Uint8ClampedArray(w * h * 4);
              for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const at = (Math.floor(y * sh / h) * sw + Math.floor(x * sw / w)) * 4;
                result.set(sourcePixels.subarray(at, at + 4), (y * w + x) * 4);
              }
              target.putImageData(new ImageData(result, w, h), 0, 0);
            } else target.drawImage(raw, ...args);
          } finally { temporary?.delete(); }
        };
        if (key === 'fillText') return (value, x, y) => {
          const text = String(value), width = target.measureText(text).width;
          target.fillText(text, x - (align === 'center' ? width / 2 : align === 'right' || align === 'end' ? width : 0), y);
        };
        const value = target[key];
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target, key, value) {
        if (key === 'textAlign') align = value;
        else if (key === 'imageSmoothingEnabled') smooth = value;
        else target[key] = value;
        return true;
      },
    });
    return { width, height, getContext() { return context; }, dispose() { canvas.dispose(); } };
  }
  class ImageDecoder {
    static async isTypeSupported(type) { return ['image/gif','image/webp','image/png'].includes(type); }
    constructor({ data }) {
      this.animated = kit.MakeAnimatedImageFromEncoded(data);
      this.static = this.animated ? undefined : kit.MakeImageFromEncoded(data);
      if (!this.animated && !this.static) throw Error('Unsupported or damaged image.');
      this.index = 0;
      this.tracks = { ready: Promise.resolve(), selectedTrack: { frameCount: this.animated?.getFrameCount() ?? 1 } };
      this.completed = Promise.resolve();
    }
    async decode({ frameIndex }) {
      if (!this.animated) return { image: wrapImage(pixelsToImage(this.static.readPixels(0, 0, {
        width: this.static.width(), height: this.static.height(), colorType: kit.ColorType.RGBA_8888,
        alphaType: kit.AlphaType.Unpremul, colorSpace: kit.ColorSpace.SRGB,
      }), this.static.width(), this.static.height())) };
      if (frameIndex < this.index) { this.animated.reset(); this.index = 0; }
      while (this.index < frameIndex) {
        if (this.animated.decodeNextFrame() < 0) throw Error('The requested animation frame is unavailable.');
        this.index++;
      }
      const image = wrapImage(this.animated.makeImageAtCurrentFrame());
      image.duration = this.animated.currentFrameDuration() * 1000;
      return { image };
    }
    close() { this.animated?.delete(); this.static?.delete(); }
  }
  const environment = {
    createSurface, ImageDecoder, ImageData,
    async createImageBitmap(blob) { return wrapImage(kit.MakeImageFromEncoded(new Uint8Array(await blob.arrayBuffer()))); },
    async encodeSurface(surface, type, quality, maxBytes) {
      const pixels = surface.getContext('2d').getImageData(0, 0, surface.width, surface.height).data;
      if (type === 'image/webp') {
        for (const factor of maxBytes ? [1,.75,.5,.3,.15] : [1]) {
          const bytes = encoder.encode(pixels, surface.width, surface.height, { ...defaultOptions, quality: quality * 100 * factor });
          if (!bytes) throw Error('The WebP encoder could not encode this image.');
          const blob = new Blob([bytes], { type });
          if (!maxBytes || blob.size <= maxBytes) return blob;
        }
        throw Error('Encoded frame exceeds its byte budget');
      }
      const image = pixelsToImage(pixels, surface.width, surface.height);
      try {
        const bytes = image.encodeToBytes(type === 'image/jpeg' ? kit.ImageFormat.JPEG : kit.ImageFormat.WEBP, Math.round(quality * 100));
        if (!bytes) throw Error('The standalone codec could not encode ' + type);
        return new Blob([bytes], { type });
      } finally { image.delete(); }
    },
    supportsColor: isPortableColor,
    disposeSurface(surface) { surface.dispose(); },
    filterSurface(surface, filters) {
      const image = surface.getContext('2d').getImageData(0, 0, surface.width, surface.height);
      let pixels = image.data;
      for (const match of filters.matchAll(/(grayscale|contrast|saturate|blur)\(([-.\d]+)(?:px)?\)/g)) {
        const value = Number(match[2]);
        if (match[1] === 'blur' && value > 0) pixels = gaussianBlur(pixels, surface.width, surface.height, value);
        else for (let i = 0; i < pixels.length; i += 4) {
          const luma = pixels[i]*.2126 + pixels[i+1]*.7152 + pixels[i+2]*.0722;
          for (let k = 0; k < 3; k++) pixels[i+k] = match[1] === 'contrast' ? (pixels[i+k]-127.5)*value+127.5 : luma+(pixels[i+k]-luma)*(match[1] === 'grayscale' ? 1-value : value);
        }
      }
      const result = createSurface(surface.width, surface.height);
      result.getContext('2d').putImageData(new ImageData(pixels, surface.width, surface.height), 0, 0);
      return result;
    },
  };
  return {
    environment,
    async loadFonts(requirements) {
      for (const key of requirements.filter(value => value.startsWith('font:'))) {
        if (loadedFonts.has(key)) continue;
        const resource = resourceManifest['font' + key.slice(5,6).toUpperCase() + key.slice(6)];
        const bytes = await readFile(await cachedResource(resource, options));
        fontOwner.loadFont(bytes, { family: resource.family });
        loadedFonts.add(key);
      }
    },
    dispose() { fontOwner.dispose(); },
  };
}

function gaussianBlur(input, width, height, sigma) {
  const radius = Math.ceil(sigma * 3), weights = new Float32Array(radius*2+1);
  let total = 0;
  for (let x=-radius;x<=radius;x++) total += weights[x+radius] = Math.exp(-x*x/(2*sigma*sigma));
  for (let x=0;x<weights.length;x++) weights[x] /= total;
  // Filter premultiplied channels so transparent edges don't acquire colour halos.
  let source = new Float32Array(input.length);
  for(let i=0;i<input.length;i+=4) { const a=input[i+3]/255; for(let k=0;k<3;k++) source[i+k]=input[i+k]*a; source[i+3]=input[i+3]; }
  for (const horizontal of [true,false]) {
    const output = new Float32Array(source.length);
    for(let y=0;y<height;y++) for(let x=0;x<width;x++) for(let d=-radius;d<=radius;d++) {
      const sx=horizontal?Math.max(0,Math.min(width-1,x+d)):x, sy=horizontal?y:Math.max(0,Math.min(height-1,y+d));
      for(let k=0;k<4;k++) output[(y*width+x)*4+k] += source[(sy*width+sx)*4+k]*weights[d+radius];
    }
    source=output;
  }
  const output=new Uint8ClampedArray(source.length);
  for(let i=0;i<source.length;i+=4) { const a=source[i+3]/255; for(let k=0;k<3;k++) output[i+k]=a?source[i+k]/a:0; output[i+3]=source[i+3]; }
  return output;
}
