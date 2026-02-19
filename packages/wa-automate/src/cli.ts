import { create, ev } from '@open-wa/legacy';
import { WAServer } from './server/hono-server';
import { ConfigSchema } from '@open-wa/schema';

const getVal = (index: number) => index !== -1 ? process.argv[index + 1] : undefined;
// const getBool = (index: number) => !((index !== -1 && process.argv[index + 1]) === false);

const sessionIdIndex = process.argv.findIndex(arg => arg === '--session-id');
const portIndex = process.argv.findIndex(arg => arg === '--port');
const hostIndex = process.argv.findIndex(arg => arg === '--host');
const apiKeyIndex = process.argv.findIndex(arg => arg === '--api-key');
const logLevelIndex = process.argv.findIndex(arg => arg === '--log-level');
const noEzqrIndex = process.argv.findIndex(arg => arg === '--no-ezqr');
const nameIndex = process.argv.findIndex(arg => arg === '--name');

const sessionId = getVal(sessionIdIndex) || 'session';
const port = getVal(portIndex) ? parseInt(getVal(portIndex)!) : 8002;
const host = getVal(hostIndex) || '0.0.0.0';
const apiKey = getVal(apiKeyIndex);
const logLevel = getVal(logLevelIndex) || 'info';
const noEzqr = noEzqrIndex !== -1;
const procName = getVal(nameIndex) || getVal(sessionIdIndex) || '@OPEN-WA EASY API';

async function start(): Promise<{ server: WAServer; client: any }> {

    const configParseResult = ConfigSchema.safeParse({
        sessionId,
        disableSpins: true,
        apiLifecycle: 'hybrid',
        port,
        host,
        socketMode: true,
        apiKey,
        ezqr: !noEzqr,
        logLevel
    });

    if (!configParseResult.success) {
        console.error('Invalid configuration:', configParseResult.error);
        process.exit(1);
    }

    const config = configParseResult.data;
    const server = new WAServer(config);

    await server.start();

    ev.on(`qr.${sessionId}`, (data: string) => {
        console.log('CLI: Received QR Code update');
        server.setQR(data);
    });

    ev.on(`qrData.${sessionId}`, () => {});

    console.log('Starting WhatsApp Client...');
    const client = await create(config as any);

    server.setClient(client);

    if (await client.isConnected()) {
        console.log('WhatsApp Client connected, API fully operational');
    }

    return { server, client };
}

const pm2Index = process.argv.findIndex(arg => arg === '--pm2');
if (pm2Index !== -1) {
    const { spawn } = require('child_process');
    try {
        const pm2 = spawn('pm2');
        
        new Promise<void>((resolve, reject) => {
            pm2.on('error', reject);
            pm2.stdout.on('data', () => resolve());
        });

        // const stringedArgs = getVal(pm2Index) || '';
        const pm2Flags = process.argv.slice(2) || [];
        const cliPath = '/Users/Mohammed/projects/tools/wa/packages/wa-automate/dist/cli.js';
        
        spawn('pm2', [
            'start',
            cliPath,
            '--name', procName,
            '--stop-exit-codes', '88',
            ...pm2Flags,
            '--',
            ...pm2Flags.filter((x: any) => !pm2Flags.includes(x))
        ], {
            stdio: 'inherit',
            detached: true
        });
    } catch (error: any) {
        if (error.errorno === -2) {
            console.error('pm2 not found. Please install with: npm install -g pm2');
        }
    }
} else {
    start().catch((err: any) => {
        console.error('Failed to start:', err);
        process.exit(1);
    });
}