import net from 'node:net';

const LOCAL_LOOPBACK_HOST = '127.0.0.1';
const DEFAULT_MAX_ATTEMPTS = 10;

function createPortExhaustionError(startFrom: number, maxAttempts: number): Error {
    return new Error(
        `Unable to find a free Lightpanda port starting at ${startFrom} after ${maxAttempts} attempts`,
    );
}

async function tryListen(port: number): Promise<number> {
    return await new Promise<number>((resolve, reject) => {
        const server = net.createServer();

        const cleanup = (): void => {
            server.removeAllListeners('error');
            server.removeAllListeners('listening');
        };

        server.once('error', (error) => {
            cleanup();
            reject(error);
        });

        server.once('listening', () => {
            const address = server.address();
            if (!address || typeof address === 'string') {
                cleanup();
                void server.close(() => reject(new Error(`Unable to resolve Lightpanda port for ${port}`)));
                return;
            }

            cleanup();
            server.close((closeError) => {
                if (closeError) {
                    reject(closeError);
                    return;
                }

                resolve(address.port);
            });
        });

        server.listen({ host: LOCAL_LOOPBACK_HOST, port, exclusive: true });
    });
}

export async function findFreePort(startFrom: number, maxAttempts = DEFAULT_MAX_ATTEMPTS): Promise<number> {
    for (let offset = 0; offset < maxAttempts; offset += 1) {
        const candidatePort = startFrom + offset;

        try {
            return await tryListen(candidatePort);
        } catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            if (code === 'EADDRINUSE' || code === 'EACCES') {
                continue;
            }

            throw error;
        }
    }

    throw createPortExhaustionError(startFrom, maxAttempts);
}

export const __internal = {
    DEFAULT_MAX_ATTEMPTS,
    LOCAL_LOOPBACK_HOST,
    createPortExhaustionError,
};
