import { WAServer } from '../src/server/hono-server';
import { io as ioc } from 'socket.io-client';
import { Config } from '../../schema/src';

// Mock config
const config: Config = {
    port: 3000,
    host: 'localhost',
    socketMode: true,
    apiLifecycle: 'immediate',
    cors: '*',
    ezqr: true,
    logLevel: 'silent',
};

const server = new WAServer(config);

async function testServer() {
    console.log('Starting server...');
    await server.start();

    console.log('Testing HTTP health check...');
    const healthRes = await fetch('http://localhost:3000/health');
    console.log('Health status:', healthRes.status);
    const healthJson = await healthRes.json();
    console.log('Health data:', healthJson);

    if (healthRes.status !== 200 || healthJson.status !== 'ok') {
        throw new Error('Health check failed');
    }

    console.log('Testing Socket connection...');
    return new Promise<void>((resolve, reject) => {
        const socket = ioc('http://localhost:3000');

        socket.on('connect', async () => {
            console.log('Socket connected!');

            // Test capability via socket
            // We will try to call 'sendText' (assuming it's registered)
            // Note: Since we are not actually running a session, the server placeholder implementation should return mocked success or error, but validating schema.

            socket.emit('sendText', {
                to: '1234567890@c.us',
                content: 'Hello World'
            }, (response: any) => {
                console.log('Socket response:', response);
                if (response.success && response.data.to === '1234567890@c.us') {
                    console.log('Socket capability test passed');
                    socket.disconnect();
                    resolve();
                } else {
                    reject(new Error('Socket capability test failed: ' + JSON.stringify(response)));
                }
            });
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connect error:', err);
            reject(err);
        });
    });
}

testServer().then(() => {
    console.log('All tests passed');
    process.exit(0);
}).catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
});
