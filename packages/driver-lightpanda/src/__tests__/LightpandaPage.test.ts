import type { DriverCapabilities } from '@open-wa/driver-interface';
import { describe, expect, it } from 'vitest';
import { LightpandaPage } from '../LightpandaPage';
import { LightpandaRenderingError } from '../errors';

function createCapabilities(overrides?: Partial<DriverCapabilities>): DriverCapabilities {
    return {
        cdp: { supported: true },
        requestInterception: { supported: true },
        serviceWorkerBypass: { supported: false, reason: 'unsupported' },
        stealth: { supported: false, reason: 'unsupported' },
        pdf: { supported: false, reason: 'Lightpanda has no rendering engine' },
        tracing: { supported: false, reason: 'Lightpanda has no rendering engine' },
        persistentContext: { supported: false, reason: 'unsupported' },
        browserExtensions: { supported: false, reason: 'unsupported' },
        exposeBinding: { supported: true },
        screenshot: { supported: false, reason: 'Lightpanda has no rendering engine' },
        rendering: { supported: false, reason: 'Lightpanda has no rendering engine' },
        ...overrides,
    };
}

describe('LightpandaPage', () => {
    it('blocks screenshots through the centralized capability guard', async () => {
        const page = new LightpandaPage(createCapabilities());

        await expect(page.screenshot({ fullPage: true })).rejects.toBeInstanceOf(LightpandaRenderingError);
        await expect(page.screenshot({ fullPage: true })).rejects.toThrow(
            "Driver 'Lightpanda' does not support capability 'screenshot': Lightpanda has no rendering engine",
        );
    });
});
