import { DriverCapabilities } from '@open-wa/driver-interface';
import { describe, expect, it } from 'vitest';
import { requireRendering, requireScreenshot } from '../capability-checks';
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

describe('Lightpanda capability checks', () => {
    it('throws a canonical rendering error when rendering is unsupported', () => {
        const driver = { capabilities: createCapabilities() };

        expect(() => requireRendering(driver)).toThrowError(LightpandaRenderingError);
        expect(() => requireRendering(driver)).toThrowError(
            "Driver 'Lightpanda' does not support capability 'rendering': Lightpanda has no rendering engine",
        );
    });

    it('throws a canonical rendering error when screenshots are unsupported', () => {
        const driver = { capabilities: createCapabilities() };

        expect(() => requireScreenshot(driver)).toThrowError(LightpandaRenderingError);
        expect(() => requireScreenshot(driver)).toThrowError(
            "Driver 'Lightpanda' does not support capability 'screenshot': Lightpanda has no rendering engine",
        );
    });

    it('passes silently when rendering-dependent capabilities are supported', () => {
        const driver = {
            capabilities: createCapabilities({
                screenshot: { supported: true },
                rendering: { supported: true },
            }),
        };

        expect(() => requireRendering(driver)).not.toThrow();
        expect(() => requireScreenshot(driver)).not.toThrow();
    });
});
