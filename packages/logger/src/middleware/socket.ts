import type { Socket } from 'socket.io';
import { rootLogger } from '../core/logger';

export const socketLogger = (socket: Socket, next: (err?: Error) => void) => {
    const logger = rootLogger.instance.child({
        component: 'socket.io',
        sessionId: socket.id,
    });

    logger.info('Socket connection attempt', {
        transport: socket.conn.transport.name,
        remoteAddress: socket.handshake.address,
    });

    socket.on('disconnect', (reason) => {
        logger.info('Socket disconnected', { reason });
    });

    socket.on('error', (err) => {
        logger.error('Socket error', { error: err });
    });

    socket.onAny((event, ...args) => {
        logger.debug('Socket event', {
            event,
            // Be careful logging args, might be huge or sensitive
            args: args.length > 0 ? '[args]' : undefined
        });
    });

    next();
};
