import { NodeHttpClient, NodeServices } from '@effect/platform-node';
import {
  InMemoryObservabilityLayer,
  runtimeCapabilitiesLayer,
} from '@open-wa/runtime-core';
import { Layer } from 'effect';

export const NodeRuntimeLayer = Layer.mergeAll(
  NodeServices.layer,
  NodeHttpClient.layerUndici,
  runtimeCapabilitiesLayer('node', [
    'browser-client',
    'chromium-launch',
    'filesystem',
    'process',
    'web-fetch',
  ]),
  InMemoryObservabilityLayer,
);

export { NodeRuntime } from '@effect/platform-node';
export * from './execution-sandbox.js';
export * from './memory-observability.js';
