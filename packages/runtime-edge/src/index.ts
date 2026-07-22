import {
  InMemoryObservabilityLayer,
  runtimeCapabilitiesLayer,
} from '@open-wa/runtime-core';
import { Layer } from 'effect';
import * as FetchHttpClient from 'effect/unstable/http/FetchHttpClient';

export const EdgeRuntimeLayer = Layer.mergeAll(
  FetchHttpClient.layer,
  runtimeCapabilitiesLayer('edge', [
    'browser-client',
    'web-fetch',
    'worker-bindings',
  ]),
  InMemoryObservabilityLayer,
);
