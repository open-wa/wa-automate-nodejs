import { Effect, Layer } from 'effect';
import {
  RuntimeCapabilityError,
  type RuntimeCapability,
  type RuntimeKind,
} from './errors';
import {
  RuntimeCapabilities,
  type RuntimeCapabilitiesShape,
} from './services';

export const makeRuntimeCapabilities = (
  runtime: RuntimeKind,
  capabilities: Iterable<RuntimeCapability>,
): RuntimeCapabilitiesShape => {
  const supported = new Set(capabilities);
  return {
    runtime,
    supported,
    has: (capability) => supported.has(capability),
    require: (capability) =>
      supported.has(capability)
        ? Effect.void
        : Effect.fail(
            new RuntimeCapabilityError({
              capability,
              runtime,
              detail: `${runtime} does not provide ${capability}`,
            }),
          ),
  };
};

export const runtimeCapabilitiesLayer = (
  runtime: RuntimeKind,
  capabilities: Iterable<RuntimeCapability>,
) => Layer.succeed(RuntimeCapabilities, makeRuntimeCapabilities(runtime, capabilities));
