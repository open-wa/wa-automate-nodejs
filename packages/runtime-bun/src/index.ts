import * as BunHttpClient from '@effect/platform-bun/BunHttpClient';
import * as BunServices from '@effect/platform-bun/BunServices';
import {
  InMemoryObservabilityLayer,
  runtimeCapabilitiesLayer,
} from '@open-wa/runtime-core';
import { Layer } from 'effect';

export const BunRuntimeLayer = Layer.mergeAll(
  BunServices.layer,
  BunHttpClient.layer,
  runtimeCapabilitiesLayer('bun', [
    'browser-client',
    'chromium-launch',
    'filesystem',
    'process',
    'web-fetch',
  ]),
  InMemoryObservabilityLayer,
);

export { BunRuntime } from '@effect/platform-bun';
