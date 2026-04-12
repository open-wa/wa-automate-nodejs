import { WAServer } from '../src/server/hono-server';
import { Config } from '../../schema/src';

// Mock config
const config: Config = {
    port: 3000,
    host: 'localhost',
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

    console.log('Skipping removed legacy Socket.IO coverage; HTTP health check passed.');
}

testServer().then(() => {
    console.log('All tests passed');
    process.exit(0);
}).catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
});
