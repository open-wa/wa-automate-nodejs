import { BrowserHttpClient } from '@effect/platform-browser';
import {
  InMemoryObservabilityLayer,
  runtimeCapabilitiesLayer,
} from '@open-wa/runtime-core';
import { Layer } from 'effect';

export const BrowserRuntimeLayer = Layer.mergeAll(
  BrowserHttpClient.layerFetch,
  runtimeCapabilitiesLayer('browser', ['browser-client', 'web-fetch']),
  InMemoryObservabilityLayer,
);

export { BrowserRuntime } from '@effect/platform-browser';
