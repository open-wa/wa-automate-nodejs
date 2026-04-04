import { describe, expect, it, vi } from 'vitest';
import { InjectionController } from '../../src/transport/InjectionController.js';
import {
  requiredRuntimeWapiMethods,
  runtimeListenerSurface,
} from '../../src/transport/runtimeListenerSurface.js';

describe('runtime listener surface inventory', () => {
  it('derives the required WAPI method inventory from the shipped listener surface', async () => {
    const controller = new InjectionController({ debug: vi.fn(), warn: vi.fn() });

    for (const entry of Object.values(runtimeListenerSurface)) {
      if (entry.kind !== 'wapi') {
        continue;
      }

      await controller.registerRuntimeWapiBridge(
        entry.event,
        entry.bindingName,
        () => undefined,
        { wapiMethod: entry.wapiMethod, required: entry.required },
      );
    }

    expect(controller.getRequiredRuntimeMethods()).toEqual(requiredRuntimeWapiMethods);
  });

  it('keeps logout listener support explicit as navigation-backed, not WAPI-backed', () => {
    expect(runtimeListenerSurface['session.logout']).toEqual({
      kind: 'navigation',
      event: 'session.logout',
      observerId: 'session.logout',
    });
  });
});
