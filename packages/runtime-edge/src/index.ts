import {
  InMemoryObservabilityLayer,
  runtimeCapabilitiesLayer,
} from '@open-wa/runtime-core';
import { Layer } from 'effect';
import { FetchHttpClient } from 'effect/http';

export const EdgeRuntimeLayer = Layer.mergeAll(
  FetchHttpClient.layer,
  runtimeCapabilitiesLayer('edge', [
    'browser-client',
    'web-fetch',
    'worker-bindings',
  ]),
  InMemoryObservabilityLayer,
);
