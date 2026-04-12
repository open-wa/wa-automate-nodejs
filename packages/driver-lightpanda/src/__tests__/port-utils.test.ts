import net from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { findFreePort } from '../port-utils';

const openServers = new Set<net.Server>();

async function reservePort(port: number): Promise<net.Server> {
    const server = net.createServer();

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen({ host: '127.0.0.1', port, exclusive: true }, () => {
            server.removeAllListeners('error');
            resolve();
        });
    });

    openServers.add(server);
    return server;
}

async function closeServer(server: net.Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });

    openServers.delete(server);
}

afterEach(async () => {
    await Promise.all([...openServers].map((server) => closeServer(server)));
});

describe('findFreePort', () => {
    it('returns a free port at or above the requested starting point', async () => {
        const port = await findFreePort(9000);

        expect(port).toBeGreaterThanOrEqual(9000);
    });

    it('retries when the first port is already in use', async () => {
        const occupied = await reservePort(9100);

        const port = await findFreePort(9100, 3);

        expect(port).toBe(9101);

        await closeServer(occupied);
    });

    it('fails deterministically when the bounded range is exhausted', async () => {
        const occupiedA = await reservePort(9200);
        const occupiedB = await reservePort(9201);

        await expect(findFreePort(9200, 2)).rejects.toThrow(
            'Unable to find a free Lightpanda port starting at 9200 after 2 attempts',
        );

        await closeServer(occupiedA);
        await closeServer(occupiedB);
    });

    it('supports concurrent allocations without returning ports below the requested range', async () => {
        const [first, second, third] = await Promise.all([
            findFreePort(9300),
            findFreePort(9310),
            findFreePort(9320),
        ]);

        expect(first).toBeGreaterThanOrEqual(9300);
        expect(second).toBeGreaterThanOrEqual(9310);
        expect(third).toBeGreaterThanOrEqual(9320);
        expect(new Set([first, second, third]).size).toBe(3);
    });
});
