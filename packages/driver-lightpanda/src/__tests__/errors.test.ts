import { DriverCapabilityError } from '@open-wa/driver-interface';
import { describe, expect, it } from 'vitest';
import {
    LightpandaConnectError,
    LightpandaInvalidExecutableError,
    LightpandaPortExhaustionError,
    LightpandaRenderingError,
    LightpandaStartupError,
} from '../errors';

describe('Lightpanda errors', () => {
    it('creates stable startup, connect, port, and executable errors', () => {
        const startupError = new LightpandaStartupError('binary not found');
        const connectError = new LightpandaConnectError('ws://127.0.0.1:9333 refused the connection');
        const portError = new LightpandaPortExhaustionError('searched ports 9222-9299');
        const executableError = new LightpandaInvalidExecutableError('/tmp/lightpanda is missing');

        expect(startupError.name).toBe('LightpandaStartupError');
        expect(startupError.message).toBe('Lightpanda failed to start: binary not found');

        expect(connectError.name).toBe('LightpandaConnectError');
        expect(connectError.message).toBe(
            'Lightpanda failed to establish a CDP connection: ws://127.0.0.1:9333 refused the connection',
        );

        expect(portError.name).toBe('LightpandaPortExhaustionError');
        expect(portError.message).toBe(
            'Lightpanda could not find an available port in the configured search range: searched ports 9222-9299',
        );

        expect(executableError.name).toBe('LightpandaInvalidExecutableError');
        expect(executableError.message).toBe(
            'Lightpanda executable path is invalid or not executable: /tmp/lightpanda is missing',
        );
    });

    it('makes rendering errors catchable as driver capability errors', () => {
        const error = new LightpandaRenderingError('screenshot', 'Lightpanda has no rendering engine');

        expect(error.name).toBe('LightpandaRenderingError');
        expect(error.message).toBe(
            "Driver 'Lightpanda' does not support capability 'screenshot': Lightpanda has no rendering engine",
        );
        expect(error).toBeInstanceOf(LightpandaRenderingError);
        expect(error).toBeInstanceOf(DriverCapabilityError);
        expect(error.driverName).toBe('Lightpanda');
        expect(error.capability).toBe('screenshot');
    });
});
