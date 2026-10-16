import { recipes } from './definitions.mjs';
import inventory from './catalogue-inventory.json' with { type: 'json' };

const fonts = { polaroid: ['font:sans'], newspaper: ['font:serif','font:mono'], stamp: ['font:mono'] };
const kernels = new Set(['invert','grayscale','stereo','dilate','erode','bayer','random']);
const numberBounds = {
  iterations: [0,8], offset: [0,256], levels: [2,32], sectors: [2,32], cell: [4,128], grid: [2,16],
  count: [1,64], copies: [1,8], bars: [2,20], samples: [2,32], size: [2,512], width: [16,512],
  height: [16,512], workingSize: [48,256], retain: [.4,1], radius: [0,32], distance: [0,128],
  threshold: [0,255], minimum: [.05,1], factor: [.1,10], quality: [.01,1], amount: [0,8], zoom: [0,1], turns: [.1,8],
};
const integerOptions = new Set(['iterations','offset','levels','sectors','cell','grid','count','copies','bars','samples','size','workingSize']);
function describeOption(name, key, value) {
  if (typeof value === 'number') {
    const [min, max] = numberBounds[key] || (key === 'strength' && ['flash','leak','rainbow','tint'].includes(name) ? [0,1] : key === 'seed' ? [0,4294967295] : [-32,32]);
    return Object.freeze({ type: 'number', min, max, integer: integerOptions.has(key), step: integerOptions.has(key) || key === 'seed' ? 1 : .01 });
  }
  if (key === 'eyes') return Object.freeze({ type: 'points', min: 0, max: 1, step: .01 });
  return Object.freeze({ type: 'string', maxLength: 128, ...(key === 'color' ? { format: 'color' } : {}) });
}
const catalogue = Object.fromEntries(inventory.map(({name,sourceCatalogue}) => [name, {
  name, version: '1', implemented: false, sourceCatalogue,
  requirements: [], browser: false, standalone: false,
  unavailableReason: 'The historical recipe has not yet been ported into the shared local renderer.',
}]));

for (const [name,recipe] of Object.entries(recipes)) {
  catalogue[name] = {
    ...catalogue[name], name, version: '1', emoji: recipe.emoji,
    description: recipe.description, defaults: Object.freeze({...recipe.defaults}),
    options: Object.freeze(Object.fromEntries(Object.entries(recipe.defaults).map(([key, value]) => [key, describeOption(name, key, value)]))),
    animated: recipe.animated, implemented: true, browser: true, standalone: true,
    requirements: Object.freeze(['canvas2d', ...(kernels.has(name) ? [`kernel:${name === 'random' ? 'invert' : name}`] : []), ...(fonts[name] ?? [])]),
    provenance: 'openwa-authored', unavailableReason: undefined,
  };
}

export const effectCatalogue = Object.freeze(Object.fromEntries(Object.entries(catalogue).map(([name,value]) => [name,Object.freeze(value)])));
export function listEffects({ backend, availableOnly = false } = {}) {
  return Object.values(effectCatalogue).filter(effect => (!availableOnly || effect.implemented) && (!backend || backend === 'auto' || effect[backend]));
}
