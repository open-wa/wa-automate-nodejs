#!/usr/bin/env node
import { createClient, Transport } from '@open-wa/core';
import { Client as ClientFacade } from '@open-wa/client';
import { PuppeteerDriver } from '@open-wa/driver-puppeteer';
import { WAServer } from './server/hono-server';
import { ConfigSchema } from '@open-wa/schema';

interface ParsedCliArgs {
    sessionId: string;
    port: number;
    host: string;
    apiKey?: string;
    logLevel: string;
    noEzqr: boolean;
    procName: string;
    pm2: boolean;
    forwardedArgs: string[];
}

function getVal(argv: string[], flag: string): string | undefined {
    const index = argv.findIndex(arg => arg === flag);
    return index !== -1 ? argv[index + 1] : undefined;
}

export function parseCliArgs(argv: string[] = process.argv.slice(2)): ParsedCliArgs {
    const sessionId = getVal(argv, '--session-id') || 'session';
    const portValue = getVal(argv, '--port');
    const port = portValue ? parseInt(portValue, 10) : 8002;
    const host = getVal(argv, '--host') || '0.0.0.0';
    const apiKey = getVal(argv, '--api-key');
    const logLevel = getVal(argv, '--log-level') || 'info';
    const noEzqr = argv.includes('--no-ezqr');
    const procName = getVal(argv, '--name') || sessionId || '@OPEN-WA EASY API';
    const pm2 = argv.includes('--pm2');

    return {
        sessionId,
        port,
        host,
        apiKey,
        logLevel,
        noEzqr,
        procName,
        pm2,
        forwardedArgs: argv,
    };
}

export async function start(parsedArgs: ParsedCliArgs = parseCliArgs()): Promise<{ server: WAServer; client: ClientFacade }> {

    const { sessionId, port, host, apiKey, logLevel, noEzqr } = parsedArgs;

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

    console.log('Starting WhatsApp Client...');

    const driver = new PuppeteerDriver();
    const openwaClient = await createClient({
        sessionId: config.sessionId,
        driver,
        debug: config.logLevel === 'debug',
        headless: config.headless,
        qrTimeoutMs: config.qrTimeout ? config.qrTimeout * 1000 : undefined,
        executablePath: config.executablePath,
    });

    openwaClient.events.on('launch.auth.qr.generated', (event) => {
        const qr = event.details?.qr;
        if (!qr) {
            return;
        }

        console.log('CLI: Received QR Code update');
        server.setQR(qr);
    });

    const transport = new Transport({
        driver,
        events: openwaClient.events,
        logger: openwaClient.logger,
        headless: config.headless,
        qrTimeoutMs: config.qrTimeout ? config.qrTimeout * 1000 : undefined,
        executablePath: config.executablePath,
    });

    const client = new ClientFacade({
        client: openwaClient,
        transport,
    });

    server.setClient(client);

    await client.start();

    console.log(`WhatsApp Client ready with state: ${client.getState()}`);

    return { server, client };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
    const parsedArgs = parseCliArgs(argv);

    if (parsedArgs.pm2) {
        const { spawn } = require('child_process');
        try {
            const pm2 = spawn('pm2');

            new Promise<void>((resolve, reject) => {
                pm2.on('error', reject);
                pm2.stdout.on('data', () => resolve());
            });

            const pm2Flags = parsedArgs.forwardedArgs;
            const cliPath = '/Users/Mohammed/projects/tools/wa/packages/wa-automate/dist/cli.js';

            spawn('pm2', [
                'start',
                cliPath,
                '--name', parsedArgs.procName,
                '--stop-exit-codes', '88',
                ...pm2Flags,
                '--',
                ...pm2Flags.filter((x: string) => !pm2Flags.includes(x))
            ], {
                stdio: 'inherit',
                detached: true
            });
            return;
        } catch (error: any) {
            if (error.errorno === -2) {
                console.error('pm2 not found. Please install with: npm install -g pm2');
                return;
            }
            throw error;
        }
    }

    await start(parsedArgs);
}

if (require.main === module) {
    main().catch((err: any) => {
        console.error('Failed to start:', err);
        process.exit(1);
    });
}
