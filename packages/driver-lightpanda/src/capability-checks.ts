import { requireCapability } from '@open-wa/driver-interface';
import { LightpandaRenderingError } from './errors';

export function requireRendering(driver: any): void {
    requireCapability({
        name: 'Lightpanda',
        capabilities: driver.capabilities,
        createCapabilityError: driver.createCapabilityError ?? ((capability, reason) => new LightpandaRenderingError(capability as 'rendering', reason)),
    }, 'rendering');
}

export function requireScreenshot(driver: any): void {
    requireCapability({
        name: 'Lightpanda',
        capabilities: driver.capabilities,
        createCapabilityError: driver.createCapabilityError ?? ((capability, reason) => new LightpandaRenderingError(capability as 'screenshot', reason)),
    }, 'screenshot');
}
