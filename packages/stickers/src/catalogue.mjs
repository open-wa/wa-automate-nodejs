import { recipes } from './definitions.mjs';
import inventory from './catalogue-inventory.json' with { type: 'json' };

const fonts = { polaroid: ['font:sans'], newspaper: ['font:serif','font:mono'], stamp: ['font:mono'] };
const kernels = new Set(['invert','grayscale','stereo','dilate','erode','bayer','random']);
const catalogue = Object.fromEntries(inventory.map(({name,sourceCatalogue}) => [name, {
  name, version: '1', implemented: false, sourceCatalogue,
  requirements: [], browser: false, standalone: false,
  unavailableReason: 'The historical recipe has not yet been ported into the shared local renderer.',
}]));

for (const [name,recipe] of Object.entries(recipes)) {
  catalogue[name] = {
    ...catalogue[name], name, version: '1', emoji: recipe.emoji,
    description: recipe.description, defaults: Object.freeze({...recipe.defaults}),
    animated: recipe.animated, implemented: true, browser: true, standalone: true,
    requirements: Object.freeze(['canvas2d', ...(kernels.has(name) ? [`kernel:${name === 'random' ? 'invert' : name}`] : []), ...(fonts[name] ?? [])]),
    provenance: 'openwa-authored', unavailableReason: undefined,
  };
}

export const effectCatalogue = Object.freeze(Object.fromEntries(Object.entries(catalogue).map(([name,value]) => [name,Object.freeze(value)])));
export function listEffects({ backend, availableOnly = false } = {}) {
  return Object.values(effectCatalogue).filter(effect => (!availableOnly || effect.implemented) && (!backend || backend === 'auto' || effect[backend]));
}
