import { DriverCapabilityError, DriverCapabilityKey } from '@open-wa/driver-interface';

const LIGHTPANDA_RENDERING_REASON = 'Lightpanda has no rendering engine';

function formatMessage(baseMessage: string, detail?: string): string {
    return detail ? `${baseMessage}: ${detail}` : baseMessage;
}

export class LightpandaStartupError extends Error {
    constructor(detail?: string) {
        super(formatMessage('Lightpanda failed to start', detail));
        this.name = 'LightpandaStartupError';
    }
}

export class LightpandaConnectError extends Error {
    constructor(detail?: string) {
        super(formatMessage('Lightpanda failed to establish a CDP connection', detail));
        this.name = 'LightpandaConnectError';
    }
}

export class LightpandaPortExhaustionError extends Error {
    constructor(detail?: string) {
        super(formatMessage('Lightpanda could not find an available port in the configured search range', detail));
        this.name = 'LightpandaPortExhaustionError';
    }
}

export class LightpandaInvalidExecutableError extends Error {
    constructor(detail?: string) {
        super(formatMessage('Lightpanda executable path is invalid or not executable', detail));
        this.name = 'LightpandaInvalidExecutableError';
    }
}

export class LightpandaRenderingError extends DriverCapabilityError {
    constructor(capability: Extract<DriverCapabilityKey, 'rendering' | 'screenshot' | 'pdf' | 'tracing'>, reason?: string) {
        super('Lightpanda', capability, reason ?? LIGHTPANDA_RENDERING_REASON);
        this.name = 'LightpandaRenderingError';
    }
}
